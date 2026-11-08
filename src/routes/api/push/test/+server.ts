import { error, json } from '@sveltejs/kit';
import { sendToUsers } from '$lib/server/reminders/push';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Log in first');
	const result = await sendToUsers([locals.user.id], {
		title: 'Lead is set up',
		body: `Reminders will arrive like this, ${locals.user.givenName}.`,
		url: '/household/notifications',
		tag: 'test'
	});
	return json(result);
};
