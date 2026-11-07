import { requireMember } from '$lib/server/access';
import { emptyPetValues, savePet } from '$lib/server/pets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	await requireMember(locals);
	return { values: emptyPetValues };
};

export const actions = {
	default: async ({ request, locals }) => {
		const { householdId, user } = await requireMember(locals);
		return savePet(request, { householdId, userId: user.id, petId: null });
	}
} satisfies Actions;
