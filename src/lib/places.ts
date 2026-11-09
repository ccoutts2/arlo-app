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

/** Apple Maps directions (opens the Maps app on iPhone). */
export function directionsUrl(p: { name: string; lat: number | null; lng: number | null }) {
	const q = encodeURIComponent(p.name);
	return p.lat !== null && p.lng !== null
		? `https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${q}`
		: `https://maps.apple.com/?q=${q}`;
}
