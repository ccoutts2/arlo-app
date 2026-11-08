import { error, json } from '@sveltejs/kit';
import { isTrustedCaller } from '$lib/server/reminders/qstash';
import { dispatch } from '$lib/server/reminders/dispatch';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	if (!(await isTrustedCaller(request, body))) error(401, 'Unauthorised');
	const { id, kind } = JSON.parse(body) as { id: string; kind: 'due' | 'followup' | 'snooze' };
	if (!id || !['due', 'followup', 'snooze'].includes(kind)) error(400, 'Bad request');
	return json(await dispatch(id, kind));
};
