// Shared (client + server) vocabulary for walks and places.
export const placeTags = [
	'Off-lead',
	'Water',
	'Café',
	'Dog-friendly pub',
	'Parking',
	'Busy at weekends'
];

// Walks reuse the 1–3 rating: shown as thumbs, always with a word so it isn't emoji-only.
export const walkRating: Record<number, { emoji: string; label: string }> = {
	3: { emoji: '👍', label: 'Good' },
	2: { emoji: '👌', label: 'In between' },
	1: { emoji: '👎', label: 'Not great' }
};

export const placeStatusLabel = { WISHLIST: 'Wishlist', BEEN: 'Been' } as const;

export type MapsApp = 'apple' | 'google' | 'waze';
export const mapsAppLabel: Record<MapsApp, string> = {
	apple: 'Apple Maps',
	google: 'Google Maps',
	waze: 'Waze'
};

/**
 * Directions links for each maps app. These are the apps' own web links: they open the app when
 * it's installed and fall back to the website otherwise. Without a pin, they search by name.
 */
export function directionsLinks(p: {
	name: string;
	lat: number | null;
	lng: number | null;
}): Record<MapsApp, string> {
	const q = encodeURIComponent(p.name);
	const pinned = p.lat !== null && p.lng !== null;
	const ll = pinned ? `${p.lat},${p.lng}` : '';
	return {
		apple: pinned ? `https://maps.apple.com/?daddr=${ll}&q=${q}` : `https://maps.apple.com/?q=${q}`,
		google: `https://www.google.com/maps/dir/?api=1&destination=${pinned ? ll : q}`,
		waze: pinned
			? `https://waze.com/ul?ll=${ll}&navigate=yes`
			: `https://waze.com/ul?q=${q}&navigate=yes`
	};
}

/** Apple Maps directions (kept for anything that only needs one link). */
export const directionsUrl = (p: { name: string; lat: number | null; lng: number | null }) =>
	directionsLinks(p).apple;
