import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { claim, pausedMessage } from '$lib/server/maps/usage';
import type { RequestHandler } from './$types';

type Feature = {
	properties: {
		name?: string;
		full_address?: string;
		place_formatted?: string;
		coordinates: { latitude: number; longitude: number };
	};
};

// Place search for moving the map. Mapbox "temporary" geocoding: results are shown, never stored
// or cached; Lead saves the pin the person drops, not these results. Every request is counted.
export const GET: RequestHandler = async ({ locals, url, fetch }) => {
	if (!locals.user) error(401, 'Log in first');
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 3 || q.length > 100) return json({ results: [] });
	if (!env.PUBLIC_MAPBOX_TOKEN)
		return json({ results: [], message: 'Search isn’t set up yet.' }, { status: 503 });
	const result = await claim('GEOCODE', locals.user.id);
	if (!result.ok)
		return json(
			{ results: [], message: pausedMessage(result.reason).replace('The map is', 'Search is') },
			{ status: 429 }
		);

	const params = new URLSearchParams({
		q,
		access_token: env.PUBLIC_MAPBOX_TOKEN,
		limit: '5',
		language: 'en'
	});
	const near = url.searchParams.get('near'); // "lng,lat" of the map view, to rank nearby places first
	if (near && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(near)) params.set('proximity', near);
	// The token is restricted to Lead's own addresses; Mapbox checks the Referer, which a server
	// request doesn't send by itself.
	const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
		headers: { referer: `${url.origin}/` }
	});
	if (!res.ok)
		return json({ results: [], message: 'Search isn’t available right now.' }, { status: 502 });
	const body = (await res.json()) as { features?: Feature[] };
	return json(
		{
			results: (body.features ?? []).map((f) => ({
				name: f.properties.name ?? f.properties.full_address ?? 'Unnamed place',
				detail: f.properties.place_formatted ?? f.properties.full_address ?? '',
				lat: f.properties.coordinates.latitude,
				lng: f.properties.coordinates.longitude
			}))
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
};
