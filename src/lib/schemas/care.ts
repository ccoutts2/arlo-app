import { z } from 'zod/v4';

const text = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Keep this under ${max} characters.`)
		.transform((v) => (v === '' ? null : v));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.');

export const careSchema = z
	.object({
		type: z.enum([
			'MEDICATION',
			'FLEA_TICK',
			'WORMING',
			'VACCINE',
			'APPOINTMENT',
			'GROOMING',
			'TRAINING',
			'CUSTOM'
		]),
		title: z.string().trim().min(1, 'Give it a name, like “Apoquel”.').max(60),
		dose: text(60),
		notes: text(200),
		stock: z
			.string()
			.trim()
			.transform((v) => (v === '' ? null : Number(v)))
			.refine(
				(v) => v === null || (Number.isInteger(v) && v >= 0 && v < 10000),
				'Use a whole number.'
			),
		refillAt: z
			.string()
			.trim()
			.transform((v) => (v === '' ? null : Number(v)))
			.refine(
				(v) => v === null || (Number.isInteger(v) && v >= 0 && v < 1000),
				'Use a whole number.'
			),
		repeat: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']),
		interval: z.coerce
			.number()
			.int()
			.min(1, 'At least 1.')
			.max(52, 'That’s a long gap. Use 52 or less.'),
		times: z
			.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time.'))
			.min(1, 'Add a time.')
			.max(6, 'Six times a day at most.'),
		startDate: date,
		endDate: z
			.string()
			.trim()
			.transform((v) => (v === '' ? null : v))
			.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Pick a date.')
	})
	.refine((v) => !v.endDate || v.endDate >= v.startDate, {
		path: ['endDate'],
		message: 'End must be after the start.'
	});

export type CareInput = z.infer<typeof careSchema>;
export type CareFormValues = Omit<Record<keyof CareInput, string>, 'times'> & { times: string[] };
export type CareFormErrors = Partial<Record<keyof CareInput, string>>;

export function parseCareForm(data: FormData) {
	const raw: CareFormValues = {
		type: String(data.get('type') ?? 'MEDICATION'),
		title: String(data.get('title') ?? ''),
		dose: String(data.get('dose') ?? ''),
		notes: String(data.get('notes') ?? ''),
		stock: String(data.get('stock') ?? ''),
		refillAt: String(data.get('refillAt') ?? ''),
		repeat: String(data.get('repeat') ?? 'DAILY'),
		interval: String(data.get('interval') ?? '1'),
		times: data.getAll('times').map(String).filter(Boolean),
		startDate: String(data.get('startDate') ?? ''),
		endDate: String(data.get('endDate') ?? '')
	};
	const result = careSchema.safeParse(raw);
	const errors: CareFormErrors = {};
	if (!result.success)
		for (const i of result.error.issues) errors[i.path[0] as keyof CareInput] ??= i.message;
	// Twice a day at the same time is a mistake, not two doses.
	if (result.success && new Set(result.data.times).size !== result.data.times.length)
		errors.times = 'Each time should be different.';
	return {
		raw,
		data:
			result.success && !errors.times
				? { ...result.data, times: [...new Set(result.data.times)].sort() }
				: null,
		errors
	};
}
