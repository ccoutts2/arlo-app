import { error, fail, redirect } from '@sveltejs/kit';
import { parseCareForm, type CareFormValues } from '$lib/schemas/care';
import type { CareItem } from '$lib/server/generated/prisma/client';
import { dueTimes, nextDueDate, type SchedulePattern } from '$lib/schedule';
import { addDays, localParts } from '$lib/time';
import prisma from './prisma';
import { bookUpcoming } from './reminders/dispatch';
import { book, cancel } from './reminders/qstash';
import { respectQuietHours } from '$lib/quiet';

const HORIZON_DAYS = 60;
const TOP_UP_WHEN_DAYS = 30;

export const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export const patternOf = (
	item: Pick<CareItem, 'repeat' | 'interval' | 'times' | 'startDate' | 'endDate'>
): SchedulePattern => ({
	repeat: item.repeat,
	interval: item.interval,
	times: item.times,
	startDate: isoDay(item.startDate)!,
	endDate: isoDay(item.endDate)
});

/**
 * Creates doses from `from` up to the horizon. Long gaps (monthly, yearly) always get at least
 * their next dose, even if it's beyond the horizon.
 */
export async function generate(item: CareItem, tz: string, from: Date, now = new Date()) {
	const p = patternOf(item);
	const horizon = new Date(now.getTime() + HORIZON_DAYS * 86400000);
	const fromDate = localParts(from, tz).date;
	let due = dueTimes(p, fromDate, localParts(horizon, tz).date, tz).filter((d) => d >= from);
	if (!due.length) {
		const next = nextDueDate(p, addDays(localParts(horizon, tz).date, 1));
		if (next) due = dueTimes(p, next, next, tz);
	}
	if (due.length) {
		await prisma.occurrence.createMany({
			data: due.map((dueAt) => ({ careItemId: item.id, dueAt })),
			skipDuplicates: true
		});
	}
	const until = due.length
		? new Date(Math.max(horizon.getTime(), due[due.length - 1].getTime()))
		: horizon;
	await prisma.careItem.update({ where: { id: item.id }, data: { generatedUntil: until } });
	await bookUpcoming({ careItemId: item.id });
}

/** After an edit: future undone doses are replaced; history (given/skipped) is kept. */
export async function regenerate(item: CareItem, tz: string, now = new Date()) {
	const future = { careItemId: item.id, status: 'PENDING' as const, dueAt: { gte: now } };
	const booked = await prisma.occurrence.findMany({
		where: { ...future, messageId: { not: null } },
		select: { messageId: true }
	});
	await cancel(booked.map((o) => o.messageId));
	await prisma.occurrence.deleteMany({ where: future });
	if (item.active) await generate(item, tz, now, now);
}

/** Keeps every active item in a household generated ahead. Cheap when nothing needs doing. */
export async function topUp(householdId: string, tz: string, now = new Date()) {
	const soon = new Date(now.getTime() + TOP_UP_WHEN_DAYS * 86400000);
	const items = await prisma.careItem.findMany({
		where: {
			active: true,
			pet: { householdId },
			OR: [{ generatedUntil: null }, { generatedUntil: { lt: soon } }]
		}
	});
	for (const item of items) await generate(item, tz, item.generatedUntil ?? now, now);
}

/** A dose in the user's household, or 404. */
export async function occurrenceOr404(householdId: string, id: string) {
	const occ = await prisma.occurrence.findFirst({
		where: { id, careItem: { pet: { householdId } } },
		include: {
			careItem: { include: { pet: { select: { id: true, name: true, photoId: true } } } },
			doneBy: { select: { id: true, givenName: true } }
		}
	});
	if (!occ) error(404, 'Not found');
	return occ;
}

export async function markGiven(occId: string, userId: string) {
	const occ = await prisma.occurrence.findUniqueOrThrow({ where: { id: occId } });
	if (occ.status === 'DONE') return; // someone else got there first; keep their tick
	await prisma.$transaction([
		prisma.occurrence.update({
			where: { id: occId },
			data: { status: 'DONE', doneAt: new Date(), doneById: userId, snoozedUntil: null }
		}),
		prisma.careItem.updateMany({
			where: { id: occ.careItemId, stock: { gt: 0 } },
			data: { stock: { decrement: 1 } }
		})
	]);
}

export async function undo(occId: string) {
	const occ = await prisma.occurrence.findUniqueOrThrow({ where: { id: occId } });
	await prisma.$transaction([
		prisma.occurrence.update({
			where: { id: occId },
			data: { status: 'PENDING', doneAt: null, doneById: null }
		}),
		...(occ.status === 'DONE'
			? [
					prisma.careItem.updateMany({
						where: { id: occ.careItemId, stock: { not: null } },
						data: { stock: { increment: 1 } }
					})
				]
			: [])
	]);
}

/** Snoozes a dose for everyone and books a reminder for when the snooze ends (quiet hours respected). */
export async function snooze(occId: string, minutes = 30) {
	const until = new Date(Date.now() + minutes * 60000);
	const o = await prisma.occurrence.update({
		where: { id: occId },
		data: { snoozedUntil: until },
		include: { careItem: { include: { pet: { include: { household: true } } } } }
	});
	const h = o.careItem.pet.household;
	await book(o.id, 'snooze', respectQuietHours(until, h.timezone, h.quietStart, h.quietEnd));
}

export const skip = (occId: string, userId: string) =>
	prisma.occurrence.update({
		where: { id: occId },
		data: { status: 'SKIPPED', doneAt: new Date(), doneById: userId }
	});

export const emptyCareValues = (startDate: string): CareFormValues => ({
	type: 'MEDICATION',
	title: '',
	dose: '',
	notes: '',
	stock: '',
	repeat: 'DAILY',
	interval: '1',
	times: ['08:00'],
	startDate,
	endDate: ''
});

export const careToValues = (c: CareItem): CareFormValues => ({
	type: c.type,
	title: c.title,
	dose: c.dose ?? '',
	notes: c.notes ?? '',
	stock: c.stock?.toString() ?? '',
	repeat: c.repeat,
	interval: String(c.interval),
	times: c.times,
	startDate: isoDay(c.startDate)!,
	endDate: isoDay(c.endDate) ?? ''
});

/** Create (careId null) or update a care item from a form, then (re)generate its doses. */
export async function saveCare(
	request: Request,
	ctx: { petId: string; userId: string; tz: string; careId: string | null }
) {
	const { raw, data, errors } = parseCareForm(await request.formData());
	if (!data) return fail(400, { values: raw, errors });
	const fields = {
		...data,
		startDate: new Date(data.startDate),
		endDate: data.endDate ? new Date(data.endDate) : null
	};
	const item = ctx.careId
		? await prisma.careItem.update({ where: { id: ctx.careId }, data: fields })
		: await prisma.careItem.create({
				data: { ...fields, petId: ctx.petId, createdById: ctx.userId }
			});
	await regenerate(item, ctx.tz);
	redirect(303, `/pets/${ctx.petId}`);
}
