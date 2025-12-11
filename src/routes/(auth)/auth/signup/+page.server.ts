import { hashPassword } from '$lib/server/password';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';


const schema = z.object({
    givenName: z.string(),
    familyName: z.string(),
    email: z.email(),
    password: z.string().min(8, "Password is not long enough.")
})

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod4(schema));

    return {
        form
    }
}

export const actions = {
	default: async ({ request }) => {

        const form = await superValidate(request, zod4(schema));

        const email = form.data.email;

        const passwordHash = await hashPassword(form.data.password);

        if (!form.valid) {
			return message(form, {
				status: 'invalid',
				text: 'Form was invalid. Please check the form for errors.'
			});
		}

        try {
            const emailCheck = await prisma.user.findUnique({
                where: { email }
            })

            if (emailCheck) {
				return message(
					form,
					{
						status: 'error',
						text: 'Email already exists. Please login.'
					},
					{
						status: 400
					}
				);
			}

            await prisma.user.create({
                data: {
                    givenName: form.data.givenName,
                    familyName: form.data.familyName,
                    email: form.data.email,
                    password: passwordHash
                }
            })

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

        return redirect(302, "/")

    }
} satisfies Actions;