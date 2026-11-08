import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { feed } from '$lib/server/log';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { householdId, tz } = await requireMember(locals);
	const filter = {
		petId: url.searchParams.get('pet'),
		type: url.searchParams.get('type'),
		skillId: url.searchParams.get('skill')
	};
	const [pets, entries, skill] = await Promise.all([
		prisma.pet.findMany({
			where: { householdId },
			orderBy: { createdAt: 'asc' },
			select: { id: true, name: true, photoId: true }
		}),
		feed(householdId, tz, filter),
		filter.skillId
			? prisma.skill.findFirst({
					where: { id: filter.skillId, pet: { householdId } },
					select: { id: true, name: true }
				})
			: null
	]);
	const today = new Date().toLocaleDateString('en-CA', { timeZone: tz });
	const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: tz });
	return { pets, entries, filter, skill, today, yesterday };
};
