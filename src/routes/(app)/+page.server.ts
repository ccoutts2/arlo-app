import prisma from '$lib/server/prisma';
import { redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import type { PageServerLoad } from './$types';


const schema = z.object({
    pet: z.string().min(1, "You must select a pet."),
    title: z.string().min(1, 'You must enter a title for this reminder.'),
    description: z.string().optional(),
    date: z.string().min(1, "You must select a start date."),
    frequency: z.string().min(1, "You must select a frequency.")
});

export const load: PageServerLoad = async ({ locals }) => {
    const form = await superValidate(zod4(schema));
    const ownderId = locals.user?.id;

    const pets = await prisma.pet.findMany({
        where: { ownerId: ownderId }
    })

    return {
        form,
        pets
    }
}