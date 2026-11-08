import type { RepeatKind } from './schedule';

export type CareTypeKey =
	| 'MEDICATION'
	| 'FLEA_TICK'
	| 'WORMING'
	| 'VACCINE'
	| 'APPOINTMENT'
	| 'GROOMING'
	| 'TRAINING'
	| 'CUSTOM';

export const careTypeLabel: Record<CareTypeKey, string> = {
	MEDICATION: 'Medicine',
	FLEA_TICK: 'Flea & tick',
	WORMING: 'Wormer',
	VACCINE: 'Vaccine',
	APPOINTMENT: 'Vet visit',
	GROOMING: 'Grooming',
	TRAINING: 'Training',
	CUSTOM: 'Other'
};

export interface Preset {
	id: string;
	label: string;
	hint: string;
	type: CareTypeKey;
	title: string;
	repeat: RepeatKind;
	interval: number;
	times: string[];
}

// One tap fills the form; everything stays editable.
export const presets: Preset[] = [
	{
		id: 'med-2x',
		label: 'Twice-daily medicine',
		hint: 'e.g. Apoquel',
		type: 'MEDICATION',
		title: '',
		repeat: 'DAILY',
		interval: 1,
		times: ['08:00', '20:00']
	},
	{
		id: 'med-1x',
		label: 'Daily medicine',
		hint: 'Once a day',
		type: 'MEDICATION',
		title: '',
		repeat: 'DAILY',
		interval: 1,
		times: ['08:00']
	},
	{
		id: 'flea-m',
		label: 'Monthly flea & tick',
		hint: 'e.g. NexGard',
		type: 'FLEA_TICK',
		title: 'Flea & tick',
		repeat: 'MONTHLY',
		interval: 1,
		times: ['09:00']
	},
	{
		id: 'flea-12w',
		label: '12-week flea & tick',
		hint: 'e.g. Bravecto',
		type: 'FLEA_TICK',
		title: 'Bravecto',
		repeat: 'WEEKLY',
		interval: 12,
		times: ['09:00']
	},
	{
		id: 'worm-3m',
		label: 'Wormer',
		hint: 'Every 3 months',
		type: 'WORMING',
		title: 'Wormer',
		repeat: 'MONTHLY',
		interval: 3,
		times: ['09:00']
	},
	{
		id: 'vacc-1y',
		label: 'Yearly booster',
		hint: 'Vaccination',
		type: 'VACCINE',
		title: 'Booster vaccine',
		repeat: 'MONTHLY',
		interval: 12,
		times: ['10:00']
	},
	{
		id: 'train',
		label: 'Daily training',
		hint: '5 minutes',
		type: 'TRAINING',
		title: 'Training session',
		repeat: 'DAILY',
		interval: 1,
		times: ['18:00']
	},
	{
		id: 'vet',
		label: 'Vet visit',
		hint: 'One-off',
		type: 'APPOINTMENT',
		title: 'Vet appointment',
		repeat: 'ONCE',
		interval: 1,
		times: ['10:00']
	}
];
