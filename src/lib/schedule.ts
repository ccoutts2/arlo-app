import { addDays, daysBetween, zonedToUtc } from './time';

export type RepeatKind = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export interface SchedulePattern {
	repeat: RepeatKind;
	interval: number;
	times: string[];
	startDate: string; // YYYY-MM-DD
	endDate: string | null;
}

function daysInMonth(y: number, m: number) {
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Does the pattern have doses on this local date? */
export function occursOn(p: SchedulePattern, date: string): boolean {
	if (date < p.startDate || (p.endDate && date > p.endDate)) return false;
	const diff = daysBetween(p.startDate, date);
	const n = Math.max(1, p.interval);
	switch (p.repeat) {
		case 'ONCE':
			return diff === 0;
		case 'DAILY':
			return diff % n === 0;
		case 'WEEKLY':
			return diff % (7 * n) === 0;
		case 'MONTHLY': {
			const [sy, sm, sd] = p.startDate.split('-').map(Number);
			const [y, m, d] = date.split('-').map(Number);
			const months = (y - sy) * 12 + (m - sm);
			if (months % n !== 0) return false;
			// The 31st becomes the last day in shorter months.
			return d === Math.min(sd, daysInMonth(y, m));
		}
	}
}

/** Due instants between two local dates (inclusive), sorted. */
export function dueTimes(p: SchedulePattern, fromDate: string, toDate: string, tz: string): Date[] {
	const out: Date[] = [];
	const times = [...p.times].sort();
	for (let d = fromDate < p.startDate ? p.startDate : fromDate; d <= toDate; d = addDays(d, 1)) {
		if (p.endDate && d > p.endDate) break;
		if (!occursOn(p, d)) continue;
		for (const t of times) out.push(zonedToUtc(d, t, tz));
		if (p.repeat === 'ONCE') break;
	}
	return out;
}

/** The first due date on or after `fromDate`, searching up to two years ahead. */
export function nextDueDate(p: SchedulePattern, fromDate: string): string | null {
	const limit = addDays(fromDate, 731);
	for (let d = fromDate < p.startDate ? p.startDate : fromDate; d <= limit; d = addDays(d, 1)) {
		if (p.endDate && d > p.endDate) return null;
		if (occursOn(p, d)) return d;
	}
	return null;
}

export function describe(p: SchedulePattern): string {
	const at = p.times.length ? ` at ${p.times.join(' and ')}` : '';
	const n = p.interval;
	switch (p.repeat) {
		case 'ONCE':
			return `Once${at}`;
		case 'DAILY':
			return n === 1
				? p.times.length === 2
					? `Twice a day${at}`
					: `Every day${at}`
				: `Every ${n} days${at}`;
		case 'WEEKLY':
			return n === 1 ? `Every week${at}` : `Every ${n} weeks${at}`;
		case 'MONTHLY':
			return n === 1 ? `Every month${at}` : n === 12 ? `Every year${at}` : `Every ${n} months${at}`;
	}
}
