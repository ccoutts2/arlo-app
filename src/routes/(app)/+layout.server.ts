import { error, redirect } from '@sveltejs/kit';
import { getHousehold } from '$lib/server/household';
import { lateCount } from '$lib/server/today';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// New visitors at the front door see what Lead is; deep links go straight to logging in.
	if (!locals.user) redirect(302, url.pathname === '/' ? '/welcome' : '/auth/login');
	const household = await getHousehold(locals.user.id);
	if (!household) error(500, 'Your account has no household. Please contact support.');
	return {
		lateCount: await lateCount(household.id),
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
