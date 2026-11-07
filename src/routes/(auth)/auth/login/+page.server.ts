import { fail, redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import prisma from '$lib/server/prisma';
import { verifyPasswordHash } from '$lib/server/password';
import { startSession } from '$lib/server/session';
import { clearFailures, lockedForMinutes, recordFailure } from '$lib/server/throttle';
import { loginSchema } from '$lib/schemas/auth';
import { acceptInvite } from '$lib/server/invites';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ form: await superValidate(zod4(loginSchema)) });

export const actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod4(loginSchema));
		if (!form.valid) return fail(400, { form });
		const { email, password } = form.data;

		const minutes = await lockedForMinutes(email);
		if (minutes > 0) {
			return message(
				form,
				`Too many wrong passwords. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
				{ status: 429 }
			);
		}

		const user = await prisma.user.findUnique({ where: { email } });
		const ok = user ? await verifyPasswordHash(user.password, password) : false;
		if (!user || !ok) {
			await recordFailure(email);
			return message(form, 'That email and password don’t match.', { status: 400 });
		}

		await clearFailures(email);
		await startSession(event, user.id);
		const token = event.url.searchParams.get('invite');
		if (token) {
			const joined = await acceptInvite(token, user.id);
			// If they can't join yet, the join page explains why.
			redirect(303, joined.ok ? '/household' : `/join/${token}`);
		}
		redirect(303, '/');
	}
} satisfies Actions;
