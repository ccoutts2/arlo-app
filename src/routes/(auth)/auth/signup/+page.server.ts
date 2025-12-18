import { hashPassword } from '$lib/server/password';
import prisma from '$lib/server/prisma';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import type { User } from '../../../../../prisma/src/generated/prisma/client';
import type { PageServerLoad } from './$types';
import { redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';

const schema = z.object({
	givenName: z.string(),
	familyName: z.string(),
	email: z.email(),
	password: z.string().min(8, 'Password is not long enough.')
});

export const load: PageServerLoad = async ({ locals }) => {
	const form = await superValidate(zod4(schema));

	if (locals.session !== null && locals.user !== null) {
		return redirect(302, '/');
	}

	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod4(schema));

		const email = form.data.email;
		let user: User;

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
			});

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

			user = await prisma.user.create({
				data: {
					givenName: form.data.givenName,
					familyName: form.data.familyName,
					email: form.data.email,
					password: passwordHash
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

		const sessionToken = await generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		await setSessionTokenCookie(event, sessionToken, session!.expiresAt);

		return redirect(302, '/');
	}
} satisfies Actions;
