import { requireMember } from '$lib/server/access';
import { markGiven, occurrenceOr404, skip, snooze, undo } from '$lib/server/care';
import { localParts } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const o = await occurrenceOr404(householdId, params.id);
	const now = new Date();
	const due = localParts(o.dueAt, tz);
	const lateBy =
		o.status === 'PENDING' && o.dueAt < now
			? Math.round((now.getTime() - o.dueAt.getTime()) / 60000)
			: 0;
	return {
		dose: {
			id: o.id,
			title: o.careItem.title,
			dose: o.careItem.dose,
			notes: o.careItem.notes,
			stock: o.careItem.stock,
			pet: o.careItem.pet,
			careItemId: o.careItemId,
			type: o.careItem.type,
			status: o.status,
			dueTime: due.time,
			dueDay: o.dueAt.toLocaleDateString('en-GB', { weekday: 'long', timeZone: tz }),
			isToday: due.date === localParts(now, tz).date,
			lateBy,
			snoozedUntil:
				o.snoozedUntil && o.snoozedUntil > now ? localParts(o.snoozedUntil, tz).time : null,
			doneBy: o.doneBy?.givenName ?? null,
			doneByMe: o.doneBy?.id === locals.user!.id,
			doneTime: o.doneAt ? localParts(o.doneAt, tz).time : null
		}
	};
};

async function act(locals: App.Locals, id: string, fn: (userId: string) => Promise<unknown>) {
	const { householdId, user } = await requireMember(locals);
	await occurrenceOr404(householdId, id);
	await fn(user.id);
}

export const actions = {
	give: async ({ locals, params }) => {
		await act(locals, params.id, (u) => markGiven(params.id, u));
		return { did: 'given' };
	},
	undo: async ({ locals, params }) => {
		await act(locals, params.id, () => undo(params.id));
		return { did: 'undone' };
	},
	snooze: async ({ locals, params }) => {
		await act(locals, params.id, () => snooze(params.id, 30));
		return { did: 'snoozed' };
	},
	skip: async ({ locals, params }) => {
		await act(locals, params.id, (u) => skip(params.id, u));
		return { did: 'skipped' };
	}
} satisfies Actions;
