// Wall-clock helpers. Dose times are stored as "HH:MM" in the household's timezone, so
// 08:00 stays 08:00 across the UK clock changes. Dates are "YYYY-MM-DD" strings.

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
	let f = fmtCache.get(tz);
	if (!f) {
		f = new Intl.DateTimeFormat('en-GB', {
			timeZone: tz,
			hourCycle: 'h23',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			weekday: 'short'
		});
		fmtCache.set(tz, f);
	}
	return f;
}

/** The wall-clock parts of an instant in a timezone. */
export function localParts(d: Date, tz: string) {
	const p = Object.fromEntries(
		fmt(tz)
			.formatToParts(d)
			.map((x) => [x.type, x.value])
	);
	return {
		date: `${p.year}-${p.month}-${p.day}`,
		time: `${p.hour}:${p.minute}`,
		weekday: p.weekday as string,
		y: +p.year,
		m: +p.month,
		d: +p.day,
		h: +p.hour,
		min: +p.minute,
		s: +p.second
	};
}

/** Milliseconds the timezone is ahead of UTC at an instant. */
function offset(d: Date, tz: string) {
	const p = localParts(d, tz);
	return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(d.getTime() / 1000) * 1000;
}

/** The instant a wall-clock date and time happens in a timezone. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	const [h, min] = time.split(':').map(Number);
	const guess = Date.UTC(y, m - 1, d, h, min);
	const first = guess - offset(new Date(guess), tz);
	// Re-check at the result so times next to a clock change land correctly.
	return new Date(guess - offset(new Date(first), tz));
}

export function addDays(date: string, n: number): string {
	const [y, m, d] = date.split('-').map(Number);
	const t = new Date(Date.UTC(y, m - 1, d + n));
	return t.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
	return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
	const dow = new Date(date + 'T00:00:00Z').getUTCDay(); // 0 Sun
	return addDays(date, -((dow + 6) % 7));
}

/** Start and end (exclusive) instants of a local day. */
export function dayBounds(date: string, tz: string) {
	return { start: zonedToUtc(date, '00:00', tz), end: zonedToUtc(addDays(date, 1), '00:00', tz) };
}

export const today = (tz: string, now = new Date()) => localParts(now, tz).date;
