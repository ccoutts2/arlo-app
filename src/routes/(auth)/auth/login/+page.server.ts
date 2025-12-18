import { verifyPasswordHash } from '$lib/server/password';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';

const schema = z.object({
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

		let user;
		let passwordMatch: boolean = false;

		if (!form.valid) {
			return message(form, {
				status: 'invalid',
				text: 'Form was invalid. Please check the form for errors.'
			});
		}

		try {
			user = await prisma.user.findUnique({
				where: {
					email: form.data.email
				}
			});

			if (user) {
				passwordMatch = await verifyPasswordHash(user.password, form.data.password);
			}
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

		if (!user || !passwordMatch) {
			return message(
				form,
				{
					status: 'error',
					text: 'Invalid email or password.'
				},
				{ status: 400 }
			);
		}

		const sessionToken = await generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		await setSessionTokenCookie(event, sessionToken, session!.expiresAt);

		return redirect(302, '/');
	}
} satisfies Actions;
