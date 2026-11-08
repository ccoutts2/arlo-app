import { describe, expect, it } from 'vitest';
import { inQuietHours, respectQuietHours } from './quiet';

const TZ = 'Europe/London';
describe('quiet hours', () => {
	it('handles windows across midnight', () => {
		expect(inQuietHours('23:10', '22:00', '07:00')).toBe(true);
		expect(inQuietHours('06:59', '22:00', '07:00')).toBe(true);
		expect(inQuietHours('07:00', '22:00', '07:00')).toBe(false);
		expect(inQuietHours('12:00', '22:00', '07:00')).toBe(false);
		expect(inQuietHours('13:30', '13:00', '14:00')).toBe(true);
		expect(inQuietHours('10:00', '07:00', '07:00')).toBe(false);
	});
	it('moves a late-night nudge to 07:00 next morning', () => {
		const at = new Date('2026-11-08T22:30:00Z'); // 22:30 London (winter)
		expect(respectQuietHours(at, TZ, '22:00', '07:00').toISOString()).toBe(
			'2026-11-09T07:00:00.000Z'
		);
	});
	it('moves an early-morning nudge to 07:00 the same day', () => {
		const at = new Date('2026-11-09T05:00:00Z');
		expect(respectQuietHours(at, TZ, '22:00', '07:00').toISOString()).toBe(
			'2026-11-09T07:00:00.000Z'
		);
	});
	it('leaves daytime nudges alone', () => {
		const at = new Date('2026-11-09T12:00:00Z');
		expect(respectQuietHours(at, TZ, '22:00', '07:00')).toEqual(at);
	});
});
