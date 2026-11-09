import { requireMember } from '$lib/server/access';
import { emptyPlaceValues, savePlace } from '$lib/server/places';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireMember(locals);
	return { values: emptyPlaceValues(url.searchParams.get('status') ?? 'WISHLIST') };
};

export const actions = {
	default: async ({ request, locals }) => {
		const { householdId, user } = await requireMember(locals);
		return savePlace(request, { householdId, userId: user.id, placeId: null });
	}
} satisfies Actions;
