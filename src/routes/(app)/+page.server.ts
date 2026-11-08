import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { buildToday } from '$lib/server/today';
import { feed } from '$lib/server/log';
import { markGiven, occurrenceOr404, restock, snooze } from '$lib/server/care';
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
	// Meds at or below their reorder point. (Prisma can't compare two columns, so filter here.)
	const counted = await prisma.careItem.findMany({
		where: { active: true, stock: { not: null }, refillAt: { not: null }, pet: { householdId } },
		select: {
			id: true,
			title: true,
			stock: true,
			refillAt: true,
			pet: { select: { id: true, name: true } }
		}
	});
	const lowStock = counted.filter((c) => c.stock! <= c.refillAt!);
	const todayLog = (await feed(householdId, tz, {}, 10)).filter((e) => e.date === day.todayDate);
	return { pets, careCount, ...day, todayLog, lowStock };
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
	},
	restock: async ({ request, locals }) => {
		const { householdId } = await requireMember(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const amount = Number(form.get('amount'));
		if (!Number.isInteger(amount) || amount < 1 || amount > 1000)
			return fail(400, { restockError: 'Enter how many came in the new pack.' });
		const item = await prisma.careItem.findFirst({ where: { id, pet: { householdId } } });
		if (!item) return fail(404);
		await restock(id, amount);
		return { restocked: id };
	}
} satisfies Actions;
