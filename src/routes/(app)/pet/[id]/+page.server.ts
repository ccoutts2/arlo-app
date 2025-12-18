import prisma from '$lib/server/prisma';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';

export const load: PageServerLoad = async ({ params }) => {
	const petId = Number(params.id);

	const petDetails = await prisma.pet.findUnique({
		where: { id: petId },
		include: {
			reminders: true
		}
	});

	return {
		petDetails
	};
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const reminderId = formData.get('reminderId');

		if (formData.has('delete') && reminderId) {
			try {
				await prisma.reminderInstance.delete({
					where: { id: Number(reminderId) }
				});
			} catch (error) {
				console.log(error);
			}
		}

		return { success: true };
	}
} satisfies Actions;
