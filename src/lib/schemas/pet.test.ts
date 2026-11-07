import { describe, expect, it } from 'vitest';
import { parsePetForm } from './pet';

const form = (o: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) f.set(k, v);
	return f;
};

describe('parsePetForm', () => {
	it('accepts a minimal dog and nulls the blanks', () => {
		const { data, errors } = parsePetForm(form({ name: ' Juno ' }));
		expect(errors).toEqual({});
		expect(data).toMatchObject({
			name: 'Juno',
			breed: null,
			sex: 'UNKNOWN',
			neutered: null,
			weightKg: null
		});
	});
	it('parses weight with a comma and neutered yes/no', () => {
		const { data } = parsePetForm(form({ name: 'Juno', weightKg: '24,6', neutered: 'yes' }));
		expect(data?.weightKg).toBe(24.6);
		expect(data?.neutered).toBe(true);
	});
	it('reports friendly errors', () => {
		const { errors } = parsePetForm(
			form({ name: '', birthday: '2999-01-01', weightKg: 'heavy', microchip: 'abc' })
		);
		expect(errors.name).toMatch(/called/);
		expect(errors.birthday).toMatch(/future/);
		expect(errors.weightKg).toMatch(/kg/);
		expect(errors.microchip).toMatch(/digits/);
	});
});
