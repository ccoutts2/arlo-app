// Shared (client + server) vocabulary for the log.
export type LogTypeKey = 'TRAINING' | 'NOTE' | 'HEALTH' | 'WALK';
export type SkillLevelKey = 'LEARNING' | 'GETTING_THERE' | 'RELIABLE';

export const logTypeLabel: Record<LogTypeKey, string> = {
	TRAINING: 'Training',
	NOTE: 'Note',
	HEALTH: 'Health',
	WALK: 'Walk'
};

export const levelLabel: Record<SkillLevelKey, string> = {
	LEARNING: 'Learning',
	GETTING_THERE: 'Getting there',
	RELIABLE: 'Reliable'
};
export const levels: SkillLevelKey[] = ['LEARNING', 'GETTING_THERE', 'RELIABLE'];

export const ratingLabel: Record<number, string> = { 1: 'Rough', 2: 'OK', 3: 'Great' };

export const healthTags = [
	'Itching',
	'Sickness',
	'Loose stool',
	'Not eating',
	'Limping',
	'Low energy',
	'Other'
];

// Suggestions when adding a skill; typing anything else works too.
export const skillIdeas = [
	'Sit',
	'Down',
	'Stay',
	'Recall',
	'Loose lead',
	'Leave it',
	'Drop it',
	'Settle',
	'Wait at doors',
	'Crate'
];
