import prisma from '../prisma';
import { localParts } from '$lib/time';
import { respectQuietHours } from '$lib/quiet';
import { lateCount } from '../today';
import { book, MAX_AHEAD_MS, type PushKind } from './qstash';
import { sendToUsers } from './push';

/** Books pushes for undone doses due within the next week that don't have one yet. */
export async function bookUpcoming(where: { careItemId?: string; householdId?: string } = {}) {
	const now = new Date();
	const due = await prisma.occurrence.findMany({
		where: {
			status: 'PENDING',
			messageId: null,
			notifiedAt: null,
			dueAt: {
				gte: new Date(now.getTime() - 5 * 60000),
				lte: new Date(now.getTime() + MAX_AHEAD_MS)
			},
			careItem: {
				active: true,
				...(where.careItemId ? { id: where.careItemId } : {}),
				...(where.householdId ? { pet: { householdId: where.householdId } } : {})
			}
		},
		select: { id: true, dueAt: true },
		take: 500
	});
	let booked = 0;
	for (const o of due) {
		const messageId = await book(o.id, 'due', o.dueAt);
		if (messageId) {
			booked++;
			await prisma.occurrence.update({ where: { id: o.id }, data: { messageId } });
		}
	}
	return booked;
}

const kindLine = {
	due: 'Due now',
	followup: 'Still not given',
	snooze: 'Snoozed reminder'
} as const;

/**
 * Called by QStash at the booked time. Safe to call more than once: it only pushes for a dose
 * that is still undone and hasn't already had this kind of push.
 */
export async function dispatch(occurrenceId: string, kind: PushKind) {
	const o = await prisma.occurrence.findUnique({
		where: { id: occurrenceId },
		include: {
			careItem: {
				include: {
					pet: { include: { household: { include: { members: { select: { userId: true } } } } } }
				}
			}
		}
	});
	if (!o || o.status !== 'PENDING' || !o.careItem.active) return { skipped: 'not pending' };
	const now = new Date();
	if (o.snoozedUntil && o.snoozedUntil.getTime() > now.getTime() + 60000 && kind !== 'snooze')
		return { skipped: 'snoozed' };
	if (kind === 'due' && o.notifiedAt) return { skipped: 'already sent' };
	if (kind === 'followup' && o.followedUpAt) return { skipped: 'already sent' };

	const household = o.careItem.pet.household;
	const time = localParts(o.dueAt, household.timezone).time;
	const result = await sendToUsers(
		household.members.map((m) => m.userId),
		{
			title: `${o.careItem.title} for ${o.careItem.pet.name}`,
			body: `${kindLine[kind]} · due ${time}${o.careItem.dose ? ` · ${o.careItem.dose}` : ''}`,
			url: `/o/${o.id}`,
			tag: o.id,
			badge: await lateCount(household.id, new Date(now.getTime() + 60000))
		}
	);

	await prisma.occurrence.update({
		where: { id: o.id },
		data: kind === 'followup' ? { followedUpAt: now } : { notifiedAt: o.notifiedAt ?? now }
	});

	// Nudge again later if it's still not given (outside quiet hours).
	if (kind !== 'followup' && household.followUpMinutes > 0 && !o.followedUpAt) {
		const at = respectQuietHours(
			new Date(now.getTime() + household.followUpMinutes * 60000),
			household.timezone,
			household.quietStart,
			household.quietEnd
		);
		await book(o.id, 'followup', at);
	}
	// Keep the chain going: book this item's next doses inside the 7-day window.
	await bookUpcoming({ careItemId: o.careItemId });
	return result;
}
