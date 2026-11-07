import { redirect, type Actions } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';

export const load = () => redirect(302, '/');

export const actions = {
	default: async (event) => {
		if (event.locals.session) await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		redirect(303, '/auth/login');
	}
} satisfies Actions;
