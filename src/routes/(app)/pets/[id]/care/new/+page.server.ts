import { petOr404, requireMember } from '$lib/server/access';
import { emptyCareValues, saveCare } from '$lib/server/care';
import { today } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	return { pet: { id: pet.id, name: pet.name }, values: emptyCareValues(today(tz)) };
};

export const actions = {
	default: async ({ request, locals, params }) => {
		const { householdId, user, tz } = await requireMember(locals);
		await petOr404(householdId, params.id);
		return saveCare(request, { petId: params.id, userId: user.id, tz, careId: null });
	}
} satisfies Actions;
