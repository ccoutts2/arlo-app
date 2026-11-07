import { describe as d, expect, it } from 'vitest';
import { describe, dueTimes, nextDueDate, occursOn, type SchedulePattern } from './schedule';
import { localParts, weekStart, zonedToUtc } from './time';

const TZ = 'Europe/London';
const p = (o: Partial<SchedulePattern>): SchedulePattern => ({
	repeat: 'DAILY',
	interval: 1,
	times: ['08:00'],
	startDate: '2026-11-01',
	endDate: null,
	...o
});

d('zonedToUtc', () => {
	it('is UTC+0 in winter and UTC+1 in summer for London', () => {
		expect(zonedToUtc('2026-12-01', '08:00', TZ).toISOString()).toBe('2026-12-01T08:00:00.000Z');
		expect(zonedToUtc('2026-07-01', '08:00', TZ).toISOString()).toBe('2026-07-01T07:00:00.000Z');
	});
	it('keeps 08:00 local on both sides of the clock change', () => {
		for (const date of [
			'2026-10-24',
			'2026-10-25',
			'2026-10-26',
			'2026-03-28',
			'2026-03-29',
			'2026-03-30'
		]) {
			expect(localParts(zonedToUtc(date, '08:00', TZ), TZ).time).toBe('08:00');
		}
	});
});

d('occursOn', () => {
	it('handles every N days and weeks', () => {
		expect(occursOn(p({ interval: 3 }), '2026-11-04')).toBe(true);
		expect(occursOn(p({ interval: 3 }), '2026-11-05')).toBe(false);
		expect(occursOn(p({ repeat: 'WEEKLY', interval: 4 }), '2026-11-29')).toBe(true);
		expect(occursOn(p({ repeat: 'WEEKLY', interval: 4 }), '2026-11-22')).toBe(false);
	});
	it('handles months, clamping the 31st', () => {
		const m = p({ repeat: 'MONTHLY', interval: 1, startDate: '2026-01-31' });
		expect(occursOn(m, '2026-02-28')).toBe(true);
		expect(occursOn(m, '2026-03-31')).toBe(true);
		expect(occursOn(m, '2026-03-30')).toBe(false);
		expect(
			occursOn(p({ repeat: 'MONTHLY', interval: 3, startDate: '2026-08-10' }), '2026-11-10')
		).toBe(true);
	});
	it('respects start, end and once', () => {
		expect(occursOn(p({}), '2026-10-31')).toBe(false);
		expect(occursOn(p({ endDate: '2026-11-03' }), '2026-11-04')).toBe(false);
		expect(occursOn(p({ repeat: 'ONCE' }), '2026-11-02')).toBe(false);
	});
});

d('dueTimes', () => {
	it('lists twice-daily doses in order', () => {
		const t = dueTimes(p({ times: ['20:00', '08:00'] }), '2026-11-01', '2026-11-02', TZ).map((x) =>
			x.toISOString()
		);
		expect(t).toEqual([
			'2026-11-01T08:00:00.000Z',
			'2026-11-01T20:00:00.000Z',
			'2026-11-02T08:00:00.000Z',
			'2026-11-02T20:00:00.000Z'
		]);
	});
	it('gives a single dose for once', () => {
		expect(
			dueTimes(
				p({ repeat: 'ONCE', startDate: '2026-11-12', times: ['16:30'] }),
				'2026-11-01',
				'2027-01-01',
				TZ
			)
		).toHaveLength(1);
	});
});

d('nextDueDate and describe', () => {
	it('finds next yearly date', () => {
		expect(
			nextDueDate(p({ repeat: 'MONTHLY', interval: 12, startDate: '2025-11-12' }), '2026-11-07')
		).toBe('2026-11-12');
	});
	it('describes patterns in plain words', () => {
		expect(describe(p({ times: ['08:00', '20:00'] }))).toBe('Twice a day at 08:00 and 20:00');
		expect(describe(p({ repeat: 'WEEKLY', interval: 12 }))).toBe('Every 12 weeks at 08:00');
		expect(describe(p({ repeat: 'MONTHLY', interval: 12 }))).toBe('Every year at 08:00');
	});
	it('finds the Monday of a week', () => expect(weekStart('2026-11-07')).toBe('2026-11-02'));
});
