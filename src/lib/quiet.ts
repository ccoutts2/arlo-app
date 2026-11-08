import { addDays, localParts, zonedToUtc } from './time';

const mins = (hhmm: string) => {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
};

/** Is this local time inside quiet hours? Handles windows that cross midnight (22:00–07:00). */
export function inQuietHours(time: string, start: string, end: string): boolean {
	const t = mins(time),
		s = mins(start),
		e = mins(end);
	if (s === e) return false;
	return s < e ? t >= s && t < e : t >= s || t < e;
}

/**
 * When a nudge (follow-up or snooze) should actually go out: `at`, or the end of quiet hours if
 * `at` falls inside them. A dose that is itself due in quiet hours is not moved (someone chose it).
 */
export function respectQuietHours(at: Date, tz: string, start: string, end: string): Date {
	const lp = localParts(at, tz);
	if (!inQuietHours(lp.time, start, end)) return at;
	const endToday = zonedToUtc(lp.date, end, tz);
	return endToday > at ? endToday : zonedToUtc(addDays(lp.date, 1), end, tz);
}
