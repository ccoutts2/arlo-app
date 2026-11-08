import { z } from 'zod/v4';
import { healthTags } from '$lib/log';

export const logSchema = z
	.object({
		type: z.enum(['TRAINING', 'NOTE', 'HEALTH', 'WALK']),
		petId: z.string().min(1, 'Pick a dog.'),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
		time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time.'),
		durationMin: z
			.string()
			.trim()
			.transform((v) => (v === '' ? null : Number(v)))
			.refine(
				(v) => v === null || (Number.isInteger(v) && v > 0 && v <= 600),
				'Minutes, 1 to 600.'
			),
		rating: z.enum(['', '1', '2', '3']).transform((v) => (v === '' ? null : Number(v))),
		body: z
			.string()
			.trim()
			.max(2000, 'Keep it under 2,000 characters.')
			.transform((v) => (v === '' ? null : v)),
		tags: z.array(z.enum(healthTags as [string, ...string[]])).max(7),
		skillIds: z.array(z.string()).max(20),
		newSkills: z.array(z.string().trim().min(1).max(40)).max(10),
		clientId: z
			.string()
			.max(64)
			.transform((v) => (v === '' ? null : v))
	})
	.refine((v) => v.type !== 'NOTE' || v.body, {
		path: ['body'],
		message: 'Write something to save a note.'
	})
	.refine((v) => v.type !== 'HEALTH' || v.body || v.tags.length, {
		path: ['tags'],
		message: 'Pick what you noticed, or write a note.'
	});

export type LogInput = z.infer<typeof logSchema>;
export type LogFormValues = {
	type: string;
	petId: string;
	date: string;
	time: string;
	durationMin: string;
	rating: string;
	body: string;
	tags: string[];
	skillIds: string[];
	newSkills: string[];
	clientId: string;
	levels: Record<string, string>;
};
export type LogFormErrors = Partial<Record<keyof LogInput | 'photo', string>>;

export function parseLogForm(f: FormData) {
	const raw: LogFormValues = {
		type: String(f.get('type') ?? 'TRAINING'),
		petId: String(f.get('petId') ?? ''),
		date: String(f.get('date') ?? ''),
		time: String(f.get('time') ?? ''),
		durationMin: String(f.get('durationMin') ?? ''),
		rating: String(f.get('rating') ?? ''),
		body: String(f.get('body') ?? ''),
		tags: f.getAll('tags').map(String),
		skillIds: f.getAll('skillIds').map(String),
		newSkills: f
			.getAll('newSkills')
			.map((s) => String(s).trim())
			.filter(Boolean),
		clientId: String(f.get('clientId') ?? ''),
		// level_<skillId> = LEARNING | GETTING_THERE | RELIABLE (only sent when changed)
		levels: Object.fromEntries(
			[...f.entries()]
				.filter(([k]) => k.startsWith('level_'))
				.map(([k, v]) => [k.slice(6), String(v)])
		)
	};
	const result = logSchema.safeParse(raw);
	const errors: LogFormErrors = {};
	if (!result.success)
		for (const i of result.error.issues) errors[i.path[0] as keyof LogInput] ??= i.message;
	return { raw, data: result.success ? result.data : null, errors };
}
