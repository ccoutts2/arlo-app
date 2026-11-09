import prisma from './prisma';

/** Dogs and their skills, for the log form and the training session screen. */
export async function logOptions(householdId: string) {
	const pets = await prisma.pet.findMany({
		where: { householdId },
		orderBy: { createdAt: 'asc' },
		select: {
			id: true,
			name: true,
			photoId: true,
			skills: { orderBy: { name: 'asc' }, select: { id: true, name: true, level: true } }
		}
	});
	const places = await prisma.place.findMany({
		where: { householdId },
		orderBy: [{ walks: { _count: 'desc' } }, { name: 'asc' }],
		select: { id: true, name: true, status: true }
	});
	return {
		places,
		pets: pets.map((p) => ({ id: p.id, name: p.name, photoId: p.photoId })),
		skillsByPet: Object.fromEntries(pets.map((p) => [p.id, p.skills]))
	};
}
