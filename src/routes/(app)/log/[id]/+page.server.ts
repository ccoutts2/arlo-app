import { redirect } from '@sveltejs/kit';
import { requireMember } from '$lib/server/access';
import { deleteEntry, entryOr404, entryToValues, saveEntry, toView } from '$lib/server/log';
import { logOptions } from '$lib/server/log-options';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const e = await entryOr404(householdId, params.id);
	return { entry: toView(e, tz), values: entryToValues(e, tz), ...(await logOptions(householdId)) };
};

export const actions = {
	save: async ({ request, locals, params }) => {
		const { householdId, user, tz } = await requireMember(locals);
		await entryOr404(householdId, params.id);
		return saveEntry(request, { householdId, userId: user.id, tz, entryId: params.id });
	},
	delete: async ({ locals, params }) => {
		const { householdId } = await requireMember(locals);
		await entryOr404(householdId, params.id);
		await deleteEntry(params.id);
		redirect(303, '/log');
	}
} satisfies Actions;
