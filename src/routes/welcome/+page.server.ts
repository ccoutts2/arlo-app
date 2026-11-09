import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The front door for people without an account. Anyone signed in goes straight to Today.
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/');
};
