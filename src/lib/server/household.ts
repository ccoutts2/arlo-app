import prisma from './prisma';

/** The household the user belongs to. Every user has exactly one for now. */
export async function getHousehold(userId: string) {
	const membership = await prisma.householdMember.findFirst({
		where: { userId },
		orderBy: { createdAt: 'asc' },
		include: {
			household: {
				include: {
					members: {
						orderBy: { createdAt: 'asc' },
						include: { user: { select: { id: true, givenName: true } } }
					}
				}
			}
		}
	});
	return membership ? { ...membership.household, role: membership.role } : null;
}
