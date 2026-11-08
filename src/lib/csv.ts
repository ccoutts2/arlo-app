/** RFC 4180 CSV: quote every field, double any quotes, CRLF line endings. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
	const cell = (v: string | number | null | undefined) =>
		`"${String(v ?? '').replace(/"/g, '""')}"`;
	return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
