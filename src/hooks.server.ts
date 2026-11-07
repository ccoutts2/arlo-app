import type { Handle } from '@sveltejs/kit';
import {
	SESSION_COOKIE,
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE) ?? null;
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);
	if (session) setSessionTokenCookie(event, token, session.expiresAt);
	else deleteSessionTokenCookie(event);

	event.locals.session = session;
	event.locals.user = user;
	return resolve(event);
};
