import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { petOr404, requireMember } from '$lib/server/access';
import { careToValues, saveCare } from '$lib/server/care';
import type { Actions, PageServerLoad } from './$types';

async function careOr404(petId: string, careId: string) {
	const item = await prisma.careItem.findFirst({ where: { id: careId, petId } });
	if (!item) error(404, 'Not found');
	return item;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	const item = await careOr404(pet.id, params.careId);
	return {
		pet: { id: pet.id, name: pet.name },
		item: { id: item.id, title: item.title },
		values: careToValues(item)
	};
};

export const actions = {
	save: async ({ request, locals, params }) => {
		const { householdId, user, tz } = await requireMember(locals);
		await petOr404(householdId, params.id);
		await careOr404(params.id, params.careId);
		return saveCare(request, { petId: params.id, userId: user.id, tz, careId: params.careId });
	},
	delete: async ({ locals, params }) => {
		const { householdId } = await requireMember(locals);
		await petOr404(householdId, params.id);
		await careOr404(params.id, params.careId);
		await prisma.careItem.delete({ where: { id: params.careId } });
		redirect(303, `/pets/${params.id}`);
	}
} satisfies Actions;
