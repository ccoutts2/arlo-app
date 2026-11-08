import { z } from 'zod/v4';

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Keep this under ${max} characters.`)
		.transform((v) => (v === '' ? null : v));

export const petSchema = z.object({
	name: z.string().trim().min(1, 'What’s your dog called?').max(40),
	breed: optionalText(60),
	sex: z.preprocess(
		(v) => (v === '' || v == null ? 'UNKNOWN' : v),
		z.enum(['FEMALE', 'MALE', 'UNKNOWN'])
	),
	birthday: z
		.string()
		.trim()
		.transform((v) => (v === '' ? null : v))
		.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a full date.')
		.refine((v) => v === null || new Date(v) <= new Date(), 'Birthday can’t be in the future.'),
	neutered: z.enum(['', 'yes', 'no']).transform((v) => (v === '' ? null : v === 'yes')),
	weightKg: z
		.string()
		.trim()
		.transform((v) => (v === '' ? null : Number(v.replace(',', '.'))))
		.refine(
			(v) => v === null || (Number.isFinite(v) && v > 0 && v < 150),
			'Enter a weight in kg, like 24.6.'
		),
	microchip: optionalText(20).refine(
		(v) => v === null || /^[0-9 ]+$/.test(v),
		'Microchip numbers are digits only.'
	),
	allergies: optionalText(120),
	note: optionalText(80),
	sitterNotes: optionalText(500),
	vetName: optionalText(80),
	vetPhone: optionalText(30),
	vetAddress: optionalText(160)
});

export type PetInput = z.infer<typeof petSchema>;
export type PetFormValues = Record<keyof PetInput, string>;
export type PetFormErrors = Partial<Record<keyof PetInput | 'photo', string>>;

/** Parses a submitted form. Returns values to re-fill the form and the first error per field. */
export function parsePetForm(data: FormData) {
	const raw = Object.fromEntries(
		Object.keys(petSchema.shape).map((k) => [k, String(data.get(k) ?? '')])
	) as PetFormValues;
	const result = petSchema.safeParse(raw);
	const errors: PetFormErrors = {};
	if (!result.success) {
		for (const issue of result.error.issues) {
			const key = issue.path[0] as keyof PetInput;
			errors[key] ??= issue.message;
		}
	}
	return { raw, data: result.success ? result.data : null, errors };
}
