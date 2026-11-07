import { error, redirect } from '@sveltejs/kit';
import { getHousehold } from '$lib/server/household';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');
	const household = await getHousehold(locals.user.id);
	if (!household) error(500, 'Your account has no household. Please contact support.');
	return {
		user: locals.user,
		household: {
			id: household.id,
			name: household.name,
			role: household.role,
			members: household.members.map((m) => ({
				id: m.user.id,
				givenName: m.user.givenName,
				role: m.role
			}))
		}
	};
};
