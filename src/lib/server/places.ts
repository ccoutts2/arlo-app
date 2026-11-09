import { error, fail, redirect } from '@sveltejs/kit';
import prisma from './prisma';
import { parsePlaceForm, type PlaceFormValues } from '$lib/schemas/place';

export const emptyPlaceValues = (status = 'WISHLIST'): PlaceFormValues => ({
	name: '',
	status: status === 'BEEN' ? 'BEEN' : 'WISHLIST',
	recommendedBy: '',
	notes: '',
	tags: [],
	lat: '',
	lng: ''
});

export async function placeOr404(householdId: string, id: string) {
	const place = await prisma.place.findFirst({ where: { id, householdId } });
	if (!place) error(404, 'Not found');
	return place;
}

export const placeToValues = (p: Awaited<ReturnType<typeof placeOr404>>): PlaceFormValues => ({
	name: p.name,
	status: p.status,
	recommendedBy: p.recommendedBy ?? '',
	notes: p.notes ?? '',
	tags: p.tags,
	lat: p.lat?.toString() ?? '',
	lng: p.lng?.toString() ?? ''
});

export async function savePlace(
	request: Request,
	ctx: { householdId: string; userId: string; placeId: string | null }
) {
	const { raw, data, errors } = parsePlaceForm(await request.formData());
	if (!data) return fail(400, { values: raw, errors });
	const place = ctx.placeId
		? await prisma.place.update({ where: { id: ctx.placeId }, data })
		: await prisma.place.create({
				data: { ...data, householdId: ctx.householdId, createdById: ctx.userId }
			});
	redirect(303, `/log/places/${place.id}`);
}

/** Thumbs counts across a set of walks, and a one-line verdict. */
export function verdict(ratings: (number | null)[]) {
	const rated = ratings.filter((r): r is number => r !== null);
	const good = rated.filter((r) => r === 3).length;
	const ok = rated.filter((r) => r === 2).length;
	const bad = rated.filter((r) => r === 1).length;
	const top = good >= ok && good >= bad ? 3 : ok >= bad ? 2 : 1;
	return { walks: ratings.length, good, ok, bad, top: rated.length ? top : null };
}
