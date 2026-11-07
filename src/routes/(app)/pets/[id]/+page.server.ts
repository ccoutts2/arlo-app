import prisma from '$lib/server/prisma';
import { petOr404, requireMember } from '$lib/server/access';
import { patternOf, topUp } from '$lib/server/care';
import { describe } from '$lib/schedule';
import { localParts } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	await topUp(householdId, tz);
	const now = new Date();
	const items = await prisma.careItem.findMany({
		where: { petId: pet.id, active: true },
		orderBy: { createdAt: 'asc' },
		include: {
			occurrences: {
				where: { status: 'PENDING', dueAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
				orderBy: { dueAt: 'asc' },
				take: 1
			}
		}
	});
	const history = await prisma.occurrence.findMany({
		where: { careItem: { petId: pet.id }, status: { in: ['DONE', 'SKIPPED'] } },
		orderBy: { doneAt: 'desc' },
		take: 8,
		include: { careItem: { select: { title: true } }, doneBy: { select: { givenName: true } } }
	});
	const fmtDay = (d: Date) =>
		d.toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: tz
		});
	return {
		pet: { ...pet, weightKg: pet.weightKg?.toString() ?? null },
		care: items.map((c) => {
			const next = c.occurrences[0];
			return {
				id: c.id,
				type: c.type,
				title: c.title,
				dose: c.dose,
				stock: c.stock,
				schedule: describe(patternOf(c)),
				next: next
					? {
							id: next.id,
							late: next.dueAt < now,
							label: `${fmtDay(next.dueAt)}, ${localParts(next.dueAt, tz).time}`
						}
					: null
			};
		}),
		history: history.map((h) => ({
			id: h.id,
			title: h.careItem.title,
			status: h.status,
			by: h.doneBy?.givenName ?? 'Someone',
			when: h.doneAt ? `${fmtDay(h.doneAt)} at ${localParts(h.doneAt, tz).time}` : ''
		}))
	};
};
