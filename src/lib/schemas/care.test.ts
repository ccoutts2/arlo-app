import { describe, expect, it } from 'vitest';
import { parseCareForm } from './care';

const form = (o: Record<string, string | string[]>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
	return f;
};
const base = {
	type: 'MEDICATION',
	title: 'Apoquel',
	repeat: 'DAILY',
	interval: '1',
	times: ['20:00', '08:00'],
	startDate: '2026-11-07'
};

describe('parseCareForm', () => {
	it('accepts twice-daily meds and sorts the times', () => {
		const { data, errors } = parseCareForm(form(base));
		expect(errors).toEqual({});
		expect(data?.times).toEqual(['08:00', '20:00']);
		expect(data?.stock).toBeNull();
	});
	it('rejects duplicate times, missing names and end before start', () => {
		expect(parseCareForm(form({ ...base, times: ['08:00', '08:00'] })).errors.times).toMatch(
			/different/
		);
		expect(parseCareForm(form({ ...base, title: '' })).errors.title).toMatch(/name/);
		expect(parseCareForm(form({ ...base, endDate: '2026-11-01' })).errors.endDate).toMatch(/after/);
	});
	it('requires at least one time', () => {
		expect(parseCareForm(form({ ...base, times: [] })).errors.times).toMatch(/Add a time/);
	});
});
