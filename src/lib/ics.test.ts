import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

describe('buildIcs', () => {
	const ics = buildIcs(
		'Juno’s care',
		[
			{
				uid: 'a-1',
				start: new Date('2026-11-12T16:30:00Z'),
				minutes: 60,
				summary: 'Booster, Riverside Vets; Juno',
				description: 'Lepto, kennel cough\nBring the card',
				url: 'https://x.test/pets/1'
			}
		],
		new Date('2026-11-08T10:00:00Z')
	);

	it('is a valid calendar with CRLF line endings', () => {
		expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
		expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
		expect(ics).not.toMatch(/[^\r]\n/);
	});
	it('writes UTC times, duration and escapes text', () => {
		expect(ics).toContain('DTSTART:20261112T163000Z');
		expect(ics).toContain('DURATION:PT60M');
		expect(ics).toContain('SUMMARY:Booster\\, Riverside Vets\\; Juno');
		expect(ics).toContain('DESCRIPTION:Lepto\\, kennel cough\\nBring the card');
	});
	it('folds long lines at 75 octets', () => {
		const long = buildIcs('x', [
			{ uid: 'b', start: new Date(), minutes: 15, summary: 'é'.repeat(80) }
		]);
		for (const line of long.split('\r\n'))
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
	});
});
