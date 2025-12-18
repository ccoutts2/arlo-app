import prisma from '$lib/server/prisma';
import { type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { ReminderFrequency } from '$lib/enums';
import { addDays, addMonths, addQuarters, addWeeks, addYears, isBefore } from 'date-fns';

const schema = z.object({
	title: z.string().min(1, 'You must enter a title.'),
	description: z.string().optional(),
	reminderDate: z.coerce.date(),
	frequency: z.enum(ReminderFrequency),
	createMultiple: z.boolean().optional().default(false)
});

export const load: PageServerLoad = async ({ params }) => {
	const petId = Number(params.id);

	const petDetails = await prisma.pet.findUnique({
		where: { id: petId },
		include: {
			reminders: true
		}
	});

	const form = await superValidate(zod4(schema));

	return {
		petDetails,
		form
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const form = await superValidate(request, zod4(schema));

		const petId = Number(params.id);

		if (!form.valid) {
			return message(form, {
				status: 'invalid',
				text: 'Form was invalid. Please check the form for errors.'
			});
		}

		if (isNaN(petId)) {
			return message(
				form,
				{
					status: 'error',
					text: 'Invalid pet ID.'
				},
				{ status: 400 }
			);
		}

		const calculateSchedule = (reminderDate: Date, frequency: ReminderFrequency) => {
			switch (frequency) {
				case 'DAILY':
					reminderDate = addDays(reminderDate, 1);
					break;
				case 'WEEKLY':
					reminderDate = addWeeks(reminderDate, 1);
					break;
				case 'MONTHLY':
					reminderDate = addMonths(reminderDate, 1);
					break;
				case 'QUARTERLY':
					reminderDate = addQuarters(reminderDate, 1);
					break;
				case 'YEARLY':
					reminderDate = addYears(reminderDate, 1);
					break;
				default:
					reminderDate;
			}
		};

		try {
			await prisma.reminders.create({
				data: {
					title: form.data.title,
					description: form.data.description,
					reminderDate: form.data.reminderDate,
					frequency: form.data.frequency,
					petId: petId,

					reminderInstances: {
						create: {
							scheduledAt: form.data.reminderDate
						}
					}
				}
			});
		} catch (error) {
			console.log(error);
			return message(
				form,
				{
					status: 'error',
					text: 'Something went wrong. Please try again.'
				},
				{
					status: 500
				}
			);
		}

		return message(form, 'Reminder created successfully!');
	}
} satisfies Actions;
