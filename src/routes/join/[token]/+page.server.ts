import { fail, redirect } from '@sveltejs/kit';
import { acceptInvite, findInvite } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const invite = await findInvite(params.token);
	return {
		token: params.token,
		signedIn: Boolean(locals.user),
		invite: invite
			? { householdName: invite.household.name, from: invite.createdBy?.givenName ?? null }
			: null
	};
};

export const actions = {
	default: async ({ params, locals }) => {
		if (!locals.user) redirect(303, `/auth/login?invite=${params.token}`);
		const result = await acceptInvite(params.token, locals.user.id);
		if (!result.ok) return fail(400, { error: result.reason });
		redirect(303, '/household');
	}
} satisfies Actions;
