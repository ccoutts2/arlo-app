import prisma from './prisma';
import { topUp } from './care';
import { addDays, dayBounds, localParts, weekStart, zonedToUtc } from '$lib/time';

export type DoseView = {
	id: string;
	careItemId: string;
	title: string;
	dose: string | null;
	type: string;
	repeat: string;
	pet: { id: string; name: string; photoId: string | null };
	dueAt: string;
	date: string; // local YYYY-MM-DD
	time: string; // local HH:MM
	status: 'PENDING' | 'DONE' | 'SKIPPED';
	late: boolean;
	snoozedUntil: string | null;
	doneBy: string | null;
	doneTime: string | null;
};

export type SheetCell = {
	date: string;
	state: 'done' | 'skipped' | 'late' | 'due' | 'later' | 'none' | 'before';
	id?: string;
	by?: string;
};
export type SheetRow = { key: string; title: string; time: string; cells: SheetCell[] };
export type Sheet = {
	pet: { id: string; name: string };
	days: { date: string; label: string; today: boolean }[];
	rows: SheetRow[];
};

const isLate = (o: { status: string; dueAt: Date; snoozedUntil: Date | null }, now: Date) =>
	o.status === 'PENDING' && (o.snoozedUntil ?? o.dueAt) < now;

/** Count of doses that are late right now (for the tab badge and app icon). */
export async function lateCount(householdId: string, now = new Date()) {
	return prisma.occurrence.count({
		where: {
			status: 'PENDING',
			careItem: { active: true, pet: { householdId } },
			dueAt: { gte: new Date(now.getTime() - 7 * 86400000) },
			OR: [{ snoozedUntil: null, dueAt: { lt: now } }, { snoozedUntil: { lt: now } }]
		}
	});
}

export async function buildToday(householdId: string, tz: string, now = new Date()) {
	await topUp(householdId, tz, now);
	const todayDate = localParts(now, tz).date;
	const monday = weekStart(todayDate);
	const from = zonedToUtc(
		addDays(todayDate, -7) < monday ? addDays(todayDate, -7) : monday,
		'00:00',
		tz
	);
	const to = dayBounds(addDays(todayDate, 7), tz).end;

	const rows = await prisma.occurrence.findMany({
		where: { dueAt: { gte: from, lt: to }, careItem: { active: true, pet: { householdId } } },
		orderBy: { dueAt: 'asc' },
		include: {
			careItem: { include: { pet: { select: { id: true, name: true, photoId: true } } } },
			doneBy: { select: { givenName: true } }
		}
	});

	const doses: DoseView[] = rows.map((o) => {
		const lp = localParts(o.dueAt, tz);
		return {
			id: o.id,
			careItemId: o.careItemId,
			title: o.careItem.title,
			dose: o.careItem.dose,
			type: o.careItem.type,
			repeat: o.careItem.repeat,
			pet: o.careItem.pet,
			dueAt: o.dueAt.toISOString(),
			date: lp.date,
			time: lp.time,
			status: o.status,
			late: isLate(o, now),
			snoozedUntil:
				o.snoozedUntil && o.snoozedUntil > now ? localParts(o.snoozedUntil, tz).time : null,
			doneBy: o.doneBy?.givenName ?? o.doneByName ?? null,
			doneTime: o.doneAt ? localParts(o.doneAt, tz).time : null
		};
	});

	const late = doses.filter((d) => d.late);
	const todo = doses.filter(
		(d) => d.status === 'PENDING' && !d.late && (d.date === todayDate || d.snoozedUntil !== null)
	);
	const done = doses.filter((d) => d.date === todayDate && d.status !== 'PENDING');
	// Daily meds already show on the sheet, so "coming up" is for the less frequent things.
	const upcoming = doses.filter(
		(d) => d.date > todayDate && d.status === 'PENDING' && !d.snoozedUntil && d.repeat !== 'DAILY'
	);

	// The weekly sheet, per dog: one row per item and time that has doses this week.
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = addDays(monday, i);
		return { date, label: 'MTWTFSS'[i], today: date === todayDate };
	});
	// The sheet is for daily doses; one-offs and monthly things live in the lists.
	const weekDoses = doses.filter(
		(d) => d.repeat === 'DAILY' && d.date >= monday && d.date <= days[6].date
	);
	const sheets: Sheet[] = [];
	const byPet = new Map<string, DoseView[]>();
	for (const d of weekDoses) byPet.set(d.pet.id, [...(byPet.get(d.pet.id) ?? []), d]);
	for (const list of byPet.values()) {
		const rowMap = new Map<string, SheetRow>();
		for (const d of list) {
			const key = `${d.careItemId}@${d.time}`;
			if (!rowMap.has(key))
				rowMap.set(key, {
					key,
					title: d.title,
					time: d.time,
					cells: days.map((day): SheetCell => ({ date: day.date, state: 'none' }))
				});
			const cell = rowMap.get(key)!.cells.find((c) => c.date === d.date)!;
			cell.id = d.id;
			cell.by = d.doneBy?.[0];
			cell.state =
				d.status === 'DONE'
					? 'done'
					: d.status === 'SKIPPED'
						? 'skipped'
						: d.late
							? 'late'
							: d.date === todayDate
								? 'due'
								: 'later';
		}
		// Days before a row's first dose (e.g. a med started mid-week) are blank, not "not scheduled".
		for (const row of rowMap.values()) {
			const first = row.cells.findIndex((c) => c.id);
			row.cells.forEach((c, i) => {
				if (i < first && c.state === 'none') c.state = 'before';
			});
		}
		const rowsSorted = [...rowMap.values()].sort(
			(a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
		);
		sheets.push({ pet: { id: list[0].pet.id, name: list[0].pet.name }, days, rows: rowsSorted });
	}

	return { todayDate, late, todo, done, upcoming, sheets };
}
