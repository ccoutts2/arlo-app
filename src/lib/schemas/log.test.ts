import { describe, expect, it } from 'vitest';
import { parseLogForm } from './log';

const form = (o: Record<string, string | string[]>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
	return f;
};
const base = { type: 'TRAINING', petId: 'p1', date: '2026-11-08', time: '09:30' };

describe('parseLogForm', () => {
	it('accepts a training session with skills, new skills and a level change', () => {
		const { data, errors, raw } = parseLogForm(
			form({
				...base,
				durationMin: '5',
				rating: '3',
				skillIds: ['s1'],
				newSkills: [' Recall ', ''],
				level_s1: 'GETTING_THERE'
			})
		);
		expect(errors).toEqual({});
		expect(data).toMatchObject({
			durationMin: 5,
			rating: 3,
			skillIds: ['s1'],
			newSkills: ['Recall']
		});
		expect(raw.levels).toEqual({ s1: 'GETTING_THERE' });
	});
	it('needs words for a note and something for a health entry', () => {
		expect(parseLogForm(form({ ...base, type: 'NOTE' })).errors.body).toMatch(/Write something/);
		expect(parseLogForm(form({ ...base, type: 'HEALTH' })).errors.tags).toMatch(/what you noticed/);
		expect(parseLogForm(form({ ...base, type: 'HEALTH', tags: 'Itching' })).errors).toEqual({});
	});
	it('rejects silly durations and unknown health tags', () => {
		expect(parseLogForm(form({ ...base, durationMin: '0' })).errors.durationMin).toBeTruthy();
		expect(
			parseLogForm(form({ ...base, type: 'HEALTH', tags: 'Exploded' })).errors.tags
		).toBeTruthy();
	});
});
