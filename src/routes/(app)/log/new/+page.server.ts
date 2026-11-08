import { requireMember } from '$lib/server/access';
import { emptyLogValues, saveEntry } from '$lib/server/log';
import { logOptions } from '$lib/server/log-options';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { householdId, tz } = await requireMember(locals);
	const q = url.searchParams;
	const values = emptyLogValues(tz, {
		type: q.get('type'),
		petId: q.get('pet'),
		duration: q.get('duration'),
		skills: q.get('skills')
	});
	const clicks = Number(q.get('clicks'));
	if (clicks > 0) values.body = `${clicks} clicks.`;
	return { values, tz, ...(await logOptions(householdId)) };
};

export const actions = {
	default: async ({ request, locals }) => {
		const { householdId, user, tz } = await requireMember(locals);
		return saveEntry(request, { householdId, userId: user.id, tz, entryId: null });
	}
} satisfies Actions;
