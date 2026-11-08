import { requireMember } from '$lib/server/access';
import { logOptions } from '$lib/server/log-options';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { householdId } = await requireMember(locals);
	return { ...(await logOptions(householdId)), petId: url.searchParams.get('pet') };
};
