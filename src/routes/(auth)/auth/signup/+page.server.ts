import { fail, redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import prisma from '$lib/server/prisma';
import { hashPassword } from '$lib/server/password';
import { startSession } from '$lib/server/session';
import { signupSchema } from '$lib/schemas/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ form: await superValidate(zod4(signupSchema)) });

export const actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod4(signupSchema));
		// Validate first, hash second.
		if (!form.valid) return fail(400, { form });

		const { givenName, email, password } = form.data;
		if (await prisma.user.findUnique({ where: { email } })) {
			return message(form, 'That email already has an account. Log in instead.', { status: 400 });
		}

		const user = await prisma.user.create({
			data: {
				givenName,
				email,
				password: await hashPassword(password),
				// Everyone starts with their own household; partners join it by invite.
				memberships: {
					create: { role: 'OWNER', household: { create: { name: `${givenName}’s household` } } }
				}
			}
		});

		await startSession(event, user.id);
		redirect(303, '/');
	}
} satisfies Actions;
