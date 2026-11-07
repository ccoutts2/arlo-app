import { redirect } from '@sveltejs/kit';
import { petOr404, requireMember } from '$lib/server/access';
import { deletePet, petToValues, savePet } from '$lib/server/pets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	return { pet: { id: pet.id, name: pet.name, photoId: pet.photoId }, values: petToValues(pet) };
};

export const actions = {
	save: async ({ request, locals, params }) => {
		const { householdId, user } = await requireMember(locals);
		await petOr404(householdId, params.id);
		return savePet(request, { householdId, userId: user.id, petId: params.id });
	},
	delete: async ({ locals, params }) => {
		const { householdId } = await requireMember(locals);
		await petOr404(householdId, params.id);
		await deletePet(params.id);
		redirect(303, '/pets');
	}
} satisfies Actions;
