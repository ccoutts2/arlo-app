import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { claim, pausedMessage } from '$lib/server/maps/usage';
import type { RequestHandler } from './$types';

// A map may only be opened after asking here: each ticket is one Mapbox map load, counted
// against Lead's caps. The (public, domain-locked) token is only handed out with a ticket.
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Log in first');
	if (!env.PUBLIC_MAPBOX_TOKEN)
		return json({ ok: false, message: 'The map isn’t set up yet.' }, { status: 503 });
	const result = await claim('MAP_LOAD', locals.user.id);
	if (!result.ok)
		return json({ ok: false, message: pausedMessage(result.reason) }, { status: 429 });
	return json({ ok: true, token: env.PUBLIC_MAPBOX_TOKEN });
};
