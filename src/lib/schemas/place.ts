import { z } from 'zod/v4';
import { placeTags } from '$lib/places';

const text = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Keep this under ${max} characters.`)
		.transform((v) => (v === '' ? null : v));
const coord = (lo: number, hi: number) =>
	z
		.string()
		.trim()
		.transform((v) => (v === '' ? null : Number(v)))
		.refine(
			(v) => v === null || (Number.isFinite(v) && v >= lo && v <= hi),
			'That location looks wrong.'
		);

export const placeSchema = z
	.object({
		name: z.string().trim().min(1, 'What’s the place called?').max(80),
		status: z.enum(['WISHLIST', 'BEEN']),
		recommendedBy: text(80),
		notes: text(1000),
		tags: z.array(z.enum(placeTags as [string, ...string[]])).max(placeTags.length),
		lat: coord(-90, 90),
		lng: coord(-180, 180)
	})
	.refine((v) => (v.lat === null) === (v.lng === null), {
		path: ['lat'],
		message: 'That location looks wrong.'
	});

export type PlaceFormValues = {
	name: string;
	status: string;
	recommendedBy: string;
	notes: string;
	tags: string[];
	lat: string;
	lng: string;
};
export type PlaceFormErrors = Partial<Record<keyof PlaceFormValues, string>>;

export function parsePlaceForm(f: FormData) {
	const raw: PlaceFormValues = {
		name: String(f.get('name') ?? ''),
		status: String(f.get('status') ?? 'WISHLIST'),
		recommendedBy: String(f.get('recommendedBy') ?? ''),
		notes: String(f.get('notes') ?? ''),
		tags: f.getAll('tags').map(String),
		lat: String(f.get('lat') ?? ''),
		lng: String(f.get('lng') ?? '')
	};
	const result = placeSchema.safeParse(raw);
	const errors: PlaceFormErrors = {};
	if (!result.success)
		for (const i of result.error.issues) errors[i.path[0] as keyof PlaceFormValues] ??= i.message;
	return { raw, data: result.success ? result.data : null, errors };
}
