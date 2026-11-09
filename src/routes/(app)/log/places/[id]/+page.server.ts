import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { placeOr404, placeToValues, savePlace, verdict } from '$lib/server/places';
import { entryInclude, toView } from '$lib/server/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const place = await placeOr404(householdId, params.id);
	const walks = await prisma.logEntry.findMany({
		where: { placeId: place.id },
		orderBy: { occurredAt: 'desc' },
		take: 30,
		include: entryInclude
	});
	const addedBy = place.createdById
		? await prisma.user.findUnique({
				where: { id: place.createdById },
				select: { givenName: true }
			})
		: null;
	return {
		place: { ...place, addedBy: addedBy?.givenName ?? null },
		values: placeToValues(place),
		walks: walks.map((w) => toView(w, tz)),
		verdict: verdict(walks.map((w) => w.rating))
	};
};

export const actions = {
	save: async ({ request, locals, params }) => {
		const { householdId, user } = await requireMember(locals);
		await placeOr404(householdId, params.id);
		return savePlace(request, { householdId, userId: user.id, placeId: params.id });
	},
	delete: async ({ locals, params }) => {
		const { householdId } = await requireMember(locals);
		await placeOr404(householdId, params.id);
		// Walks keep their entries; they just lose the place.
		await prisma.place.delete({ where: { id: params.id } });
		redirect(303, '/log/places');
	}
} satisfies Actions;
