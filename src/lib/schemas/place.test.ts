import { describe, expect, it } from 'vitest';
import { parsePlaceForm } from './place';

const form = (o: Record<string, string | string[]>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
	return f;
};

describe('parsePlaceForm', () => {
	it('accepts a wishlist place with tags and a pin', () => {
		const { data, errors } = parsePlaceForm(
			form({
				name: ' Bushy Park ',
				status: 'WISHLIST',
				recommendedBy: 'Sarah at the park',
				tags: ['Off-lead', 'Water'],
				lat: '51.41',
				lng: '-0.33'
			})
		);
		expect(errors).toEqual({});
		expect(data).toMatchObject({
			name: 'Bushy Park',
			status: 'WISHLIST',
			tags: ['Off-lead', 'Water'],
			lat: 51.41,
			lng: -0.33,
			notes: null
		});
	});
	it('needs a name, a sensible location and known tags', () => {
		const { errors } = parsePlaceForm(
			form({ name: '', status: 'BEEN', tags: 'Lava', lat: '200', lng: '0' })
		);
		expect(errors.name).toMatch(/called/);
		expect(errors.tags).toBeTruthy();
		expect(errors.lat).toMatch(/location/);
	});
	it('rejects half a location', () => {
		expect(
			parsePlaceForm(form({ name: 'X', status: 'BEEN', lat: '51.4' })).errors.lat
		).toBeTruthy();
	});
});
