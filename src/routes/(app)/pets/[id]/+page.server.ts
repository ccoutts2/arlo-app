import prisma from '$lib/server/prisma';
import { petOr404, requireMember } from '$lib/server/access';
import { patternOf, topUp } from '$lib/server/care';
import { describe } from '$lib/schedule';
import { localParts } from '$lib/time';
import { skillsFor } from '$lib/server/skills';
import { feed } from '$lib/server/log';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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
	// Walks card: this month's walks and minutes, and the places this dog rated best.
	const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
	const recentWalks = await prisma.logEntry.findMany({
		where: {
			petId: pet.id,
			type: 'WALK',
			occurredAt: { gte: new Date(Date.now() - 365 * 86400000) }
		},
		select: {
			occurredAt: true,
			durationMin: true,
			rating: true,
			place: { select: { id: true, name: true } }
		}
	});
	const monthWalks = recentWalks.filter((w) => w.occurredAt >= monthStart);
	const byPlace = new Map<string, { id: string; name: string; walks: number; good: number }>();
	for (const w of recentWalks) {
		if (!w.place) continue;
		const e = byPlace.get(w.place.id) ?? { ...w.place, walks: 0, good: 0 };
		e.walks++;
		if (w.rating === 3) e.good++;
		byPlace.set(w.place.id, e);
	}
	const walkStats = {
		count: monthWalks.length,
		minutes: monthWalks.reduce((sum, w) => sum + (w.durationMin ?? 0), 0),
		favourites: [...byPlace.values()]
			.sort((a, b) => b.good - a.good || b.walks - a.walks)
			.slice(0, 3)
	};
	const weights = await prisma.weightEntry.findMany({
		where: { petId: pet.id },
		orderBy: { at: 'asc' },
		take: 60
	});
	const [skills, recentLog] = await Promise.all([
		skillsFor(pet.id),
		feed(householdId, tz, { petId: pet.id }, 3)
	]);
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
		skills: skills.map((s) => ({
			...s,
			lastPractised: s.lastPractised ? fmtDay(s.lastPractised) : null
		})),
		recentLog,
		walkStats,
		weights: weights.map((w) => ({
			id: w.id,
			at: w.at.toISOString(),
			kg: Number(w.kg),
			label: fmtDay(w.at)
		})),
		history: history.map((h) => ({
			id: h.id,
			title: h.careItem.title,
			status: h.status,
			by: h.doneBy?.givenName ?? h.doneByName ?? 'Someone',
			when: h.doneAt ? `${fmtDay(h.doneAt)} at ${localParts(h.doneAt, tz).time}` : ''
		}))
	};
};

export const actions = {
	weight: async ({ locals, params, request }) => {
		const { householdId, user } = await requireMember(locals);
		const pet = await petOr404(householdId, params.id);
		const kg = Number(String((await request.formData()).get('kg') ?? '').replace(',', '.'));
		if (!Number.isFinite(kg) || kg <= 0 || kg >= 150)
			return fail(400, { weightError: 'Enter a weight in kg, like 24.6.' });
		await prisma.$transaction([
			prisma.weightEntry.create({ data: { petId: pet.id, kg, byId: user.id } }),
			// The profile always shows the latest weight.
			prisma.pet.update({ where: { id: pet.id }, data: { weightKg: kg } })
		]);
		return { weighed: true };
	}
} satisfies Actions;
