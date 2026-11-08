import { error } from '@sveltejs/kit';
import prisma from './prisma';

/** A skill belonging to a dog in the user's household, or 404. */
export async function skillOr404(householdId: string, petId: string, skillId: string) {
	const skill = await prisma.skill.findFirst({
		where: { id: skillId, petId, pet: { householdId } },
		include: {
			// Ids are time-ordered, so steps added at the same moment keep creation order.
			steps: {
				orderBy: [{ position: 'asc' }, { id: 'asc' }],
				include: { doneBy: { select: { givenName: true } } }
			}
		}
	});
	if (!skill) error(404, 'Not found');
	return skill;
}

/** Skills for a dog with step progress and how often/recently they've been practised. */
export async function skillsFor(petId: string) {
	const skills = await prisma.skill.findMany({
		where: { petId },
		orderBy: [{ level: 'asc' }, { name: 'asc' }],
		include: {
			steps: { select: { doneAt: true } },
			entries: { select: { logEntry: { select: { occurredAt: true } } } }
		}
	});
	return skills.map((s) => {
		const dates = s.entries.map((e) => e.logEntry.occurredAt.getTime());
		return {
			id: s.id,
			name: s.name,
			level: s.level,
			steps: s.steps.length,
			stepsDone: s.steps.filter((x) => x.doneAt).length,
			sessions: dates.length,
			lastPractised: dates.length ? new Date(Math.max(...dates)) : null
		};
	});
}
