import { error, redirect } from '@sveltejs/kit';
import prisma from './prisma';

/** The signed-in user and their household id, or a redirect to log in. */
export async function requireMember(locals: App.Locals) {
	if (!locals.user) redirect(302, '/auth/login');
	const membership = await prisma.householdMember.findFirst({
		where: { userId: locals.user.id },
		orderBy: { createdAt: 'asc' },
		select: { householdId: true, role: true, household: { select: { timezone: true } } }
	});
	if (!membership) error(500, 'Your account has no household.');
	return {
		user: locals.user,
		householdId: membership.householdId,
		role: membership.role,
		tz: membership.household.timezone
	};
}

/** A pet in the user's household. Anything else is a 404, so ids from other households leak nothing. */
export async function petOr404(householdId: string, petId: string) {
	const pet = await prisma.pet.findFirst({ where: { id: petId, householdId } });
	if (!pet) error(404, 'Dog not found');
	return pet;
}
