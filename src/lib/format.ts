/** "1 yr 4 mo", "7 mo" or "3 wk" from a birthday. */
export function age(birthday: Date | string | null, now = new Date()): string | null {
	if (!birthday) return null;
	const b = new Date(birthday);
	let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
	if (now.getDate() < b.getDate()) months -= 1;
	if (months < 1) {
		const weeks = Math.max(0, Math.floor((now.getTime() - b.getTime()) / (7 * 24 * 3600 * 1000)));
		return `${weeks} wk`;
	}
	const y = Math.floor(months / 12);
	const m = months % 12;
	return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
}

export const sexLabel = { FEMALE: 'Girl', MALE: 'Boy', UNKNOWN: 'Not set' } as const;

/** yyyy-mm-dd for date inputs. */
export const isoDate = (d: Date | string | null) =>
	d ? new Date(d).toISOString().slice(0, 10) : '';
