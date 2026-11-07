import { describe, expect, it } from 'vitest';
import { age } from './format';

const now = new Date('2026-11-07T12:00:00Z');
describe('age', () => {
	it('formats years and months', () => expect(age('2025-07-01', now)).toBe('1 yr 4 mo'));
	it('formats whole years', () => expect(age('2024-11-07', now)).toBe('2 yr'));
	it('formats months only', () => expect(age('2026-04-01', now)).toBe('7 mo'));
	it('formats young puppies in weeks', () => expect(age('2026-10-20', now)).toBe('2 wk'));
	it('handles no birthday', () => expect(age(null, now)).toBeNull());
});
