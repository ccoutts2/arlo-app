import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { buildToday } from '$lib/server/today';
import { markGiven, occurrenceOr404, snooze } from '$lib/server/care';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { householdId, tz } = await requireMember(locals);
	const [pets, careCount, day] = await Promise.all([
		prisma.pet.findMany({
			where: { householdId },
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, photoId: true }
		}),
		prisma.careItem.count({ where: { active: true, pet: { householdId } } }),
		buildToday(householdId, tz)
	]);
	return { pets, careCount, ...day };
};

export const actions = {
	give: async ({ request, locals }) => {
		const { householdId, user } = await requireMember(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400);
		await occurrenceOr404(householdId, id);
		await markGiven(id, user.id);
		return { given: id };
	},
	snooze: async ({ request, locals }) => {
		const { householdId } = await requireMember(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400);
		await occurrenceOr404(householdId, id);
		await snooze(id, 30);
		return { snoozed: id };
	}
} satisfies Actions;
