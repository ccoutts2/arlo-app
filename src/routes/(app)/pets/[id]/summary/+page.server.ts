import prisma from '$lib/server/prisma';
import { petOr404, requireMember } from '$lib/server/access';
import { patternOf } from '$lib/server/care';
import { describe } from '$lib/schedule';
import { localParts } from '$lib/time';
import type { PageServerLoad } from './$types';

// A vet-ready summary: details, treatments, what was given, vaccines, weight, health notes, skills.
export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	const since90 = new Date(Date.now() - 90 * 86400000);
	const [care, given, vaccines, weights, health, skills] = await Promise.all([
		prisma.careItem.findMany({
			where: { petId: pet.id, active: true },
			orderBy: { createdAt: 'asc' }
		}),
		prisma.occurrence.findMany({
			where: {
				careItem: { petId: pet.id, type: { not: 'VACCINE' } },
				status: { in: ['DONE', 'SKIPPED'] },
				dueAt: { gte: new Date(Date.now() - 30 * 86400000) }
			},
			orderBy: { dueAt: 'desc' },
			include: { careItem: { select: { title: true } }, doneBy: { select: { givenName: true } } }
		}),
		prisma.occurrence.findMany({
			where: { careItem: { petId: pet.id, type: 'VACCINE' }, status: 'DONE' },
			orderBy: { doneAt: 'desc' },
			include: { careItem: { select: { title: true } } }
		}),
		prisma.weightEntry.findMany({ where: { petId: pet.id }, orderBy: { at: 'desc' }, take: 10 }),
		prisma.logEntry.findMany({
			where: { petId: pet.id, type: 'HEALTH', occurredAt: { gte: since90 } },
			orderBy: { occurredAt: 'desc' }
		}),
		prisma.skill.findMany({ where: { petId: pet.id }, orderBy: { name: 'asc' } })
	]);
	const day = (d: Date) =>
		d.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: tz
		});
	return {
		generated: day(new Date()),
		pet: {
			...pet,
			weightKg: pet.weightKg?.toString() ?? null,
			birthday: pet.birthday ? day(pet.birthday) : null
		},
		care: care.map((c) => ({
			id: c.id,
			title: c.title,
			dose: c.dose,
			schedule: describe(patternOf(c))
		})),
		given: given.map((g) => ({
			id: g.id,
			title: g.careItem.title,
			due: `${day(g.dueAt)} ${localParts(g.dueAt, tz).time}`,
			status: g.status,
			by: g.doneBy?.givenName ?? g.doneByName ?? ''
		})),
		vaccines: vaccines.map((v) => ({
			id: v.id,
			title: v.careItem.title,
			on: day(v.doneAt ?? v.dueAt)
		})),
		weights: weights.map((w) => ({ id: w.id, on: day(w.at), kg: Number(w.kg) })),
		health: health.map((h) => ({ id: h.id, on: day(h.occurredAt), tags: h.tags, body: h.body })),
		skills: skills.map((s) => ({ id: s.id, name: s.name, level: s.level }))
	};
};
