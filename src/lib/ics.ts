// Builds an iCalendar (RFC 5545) feed. Pure, so it's unit-tested.
export type IcsEvent = {
	uid: string;
	start: Date;
	minutes: number;
	summary: string;
	description?: string;
	url?: string;
};

const stamp = (d: Date) =>
	d
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
const escape = (s: string) =>
	s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets are folded with CRLF + space (UTF-8 safe). */
function fold(line: string): string {
	const out: string[] = [];
	let current = '';
	let bytes = 0;
	for (const ch of line) {
		const b = new TextEncoder().encode(ch).length;
		if (bytes + b > (out.length ? 74 : 75)) {
			out.push(current);
			current = '';
			bytes = 0;
		}
		current += ch;
		bytes += b;
	}
	out.push(current);
	return out.join('\r\n ');
}

export function buildIcs(name: string, events: IcsEvent[], now = new Date()): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Lead//Dog care//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escape(name)}`,
		'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
		'X-PUBLISHED-TTL:PT6H'
	];
	for (const e of events) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:${e.uid}@lead`,
			`DTSTAMP:${stamp(now)}`,
			`DTSTART:${stamp(e.start)}`,
			`DURATION:PT${e.minutes}M`,
			`SUMMARY:${escape(e.summary)}`,
			...(e.description ? [`DESCRIPTION:${escape(e.description)}`] : []),
			...(e.url ? [`URL:${e.url}`] : []),
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
