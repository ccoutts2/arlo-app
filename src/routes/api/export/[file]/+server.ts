import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { localParts } from '$lib/time';
import { toCsv } from '$lib/csv';
import type { RequestHandler } from './$types';

// Household data as CSV: /api/export/log.csv and /api/export/doses.csv
export const GET: RequestHandler = async ({ params, locals }) => {
	const { householdId, tz } = await requireMember(locals);
	const when = (d: Date | null) => (d ? `${localParts(d, tz).date} ${localParts(d, tz).time}` : '');
	let csv: string;
	if (params.file === 'log.csv') {
		const rows = await prisma.logEntry.findMany({
			where: { pet: { householdId } },
			orderBy: { occurredAt: 'desc' },
			include: {
				pet: { select: { name: true } },
				author: { select: { givenName: true } },
				skills: { include: { skill: { select: { name: true } } } }
			}
		});
		csv = toCsv(
			['When', 'Dog', 'Type', 'Minutes', 'How it went', 'Skills', 'Noticed', 'Notes', 'By'],
			rows.map((r) => [
				when(r.occurredAt),
				r.pet.name,
				r.type,
				r.durationMin,
				r.rating ? ['', 'Rough', 'OK', 'Great'][r.rating] : '',
				r.skills.map((s) => s.skill.name).join('; '),
				r.tags.join('; '),
				r.body,
				r.author?.givenName
			])
		);
	} else if (params.file === 'doses.csv') {
		const rows = await prisma.occurrence.findMany({
			where: { status: { in: ['DONE', 'SKIPPED'] }, careItem: { pet: { householdId } } },
			orderBy: { dueAt: 'desc' },
			include: {
				careItem: { include: { pet: { select: { name: true } } } },
				doneBy: { select: { givenName: true } }
			}
		});
		csv = toCsv(
			['Due', 'Dog', 'Treatment', 'Dose', 'Status', 'Done at', 'By'],
			rows.map((r) => [
				when(r.dueAt),
				r.careItem.pet.name,
				r.careItem.title,
				r.careItem.dose,
				r.status === 'DONE' ? 'Given' : 'Skipped',
				when(r.doneAt),
				r.doneBy?.givenName ?? r.doneByName
			])
		);
	} else error(404, 'Not found');
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="lead-${params.file}"`,
			'cache-control': 'private, no-store'
		}
	});
};
