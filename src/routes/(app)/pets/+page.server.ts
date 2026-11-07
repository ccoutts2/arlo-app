import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { householdId } = await requireMember(locals);
	const pets = await prisma.pet.findMany({
		where: { householdId },
		orderBy: { createdAt: 'asc' },
		select: { id: true, name: true, breed: true, birthday: true, photoId: true }
	});
	return { pets };
};
