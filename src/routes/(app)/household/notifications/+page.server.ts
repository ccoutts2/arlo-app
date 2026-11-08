import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { householdId, user } = await requireMember(locals);
	const [household, devices] = await Promise.all([
		prisma.household.findUniqueOrThrow({
			where: { id: householdId },
			select: { quietStart: true, quietEnd: true, followUpMinutes: true }
		}),
		prisma.pushSubscription.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'asc' },
			select: {
				id: true,
				label: true,
				lastSuccessAt: true,
				lastErrorAt: true,
				failures: true,
				createdAt: true
			}
		})
	]);
	return { settings: household, devices };
};

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time.');
const settingsSchema = z.object({
	quietStart: time,
	quietEnd: time,
	followUpMinutes: z.coerce
		.number()
		.int()
		.refine((v) => [0, 30, 60, 120, 240].includes(v))
});

export const actions = {
	settings: async ({ locals, request }) => {
		const { householdId } = await requireMember(locals);
		const parsed = settingsSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Check the times and try again.' });
		await prisma.household.update({ where: { id: householdId }, data: parsed.data });
		return { saved: true };
	}
} satisfies Actions;
