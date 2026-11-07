import { petOr404, requireMember } from '$lib/server/access';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	return { pet: { ...pet, weightKg: pet.weightKg?.toString() ?? null } };
};
