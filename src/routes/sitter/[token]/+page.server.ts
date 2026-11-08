import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { findSitterLink } from '$lib/server/sitter';
import { checkRefill, topUp } from '$lib/server/care';
import { localParts } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

const WINDOW_BACK = 12 * 3600_000; // late doses from the last 12 hours
const WINDOW_AHEAD = 24 * 3600_000;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({ 'x-robots-tag': 'noindex', 'cache-control': 'private, no-store' });
	const link = await findSitterLink(params.token);
	if (!link) return { link: null };
	const tz = link.household.timezone;
	await topUp(link.householdId, tz);
	const now = new Date();
	const pets = await prisma.pet.findMany({
		where: { householdId: link.householdId },
		orderBy: { createdAt: 'asc' },
		include: {
			care: {
				where: { active: true },
				include: {
					occurrences: {
						where: {
							dueAt: {
								gte: new Date(now.getTime() - WINDOW_BACK),
								lte: new Date(now.getTime() + WINDOW_AHEAD)
							}
						},
						orderBy: { dueAt: 'asc' },
						include: { doneBy: { select: { givenName: true } } }
					}
				}
			}
		}
	});
	const fmt = (d: Date) => {
		const p = localParts(d, tz);
		const day =
			p.date === localParts(now, tz).date
				? 'today'
				: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: tz });
		return `${day} ${p.time}`;
	};
	return {
		link: {
			sitterName: link.sitterName,
			household: link.household.name,
			until: link.expiresAt.toLocaleDateString('en-GB', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				timeZone: tz
			})
		},
		pets: pets.map((p) => ({
			id: p.id,
			name: p.name,
			photoId: p.photoId,
			breed: p.breed,
			allergies: p.allergies,
			sitterNotes: p.sitterNotes,
			vet:
				p.vetName || p.vetPhone
					? { name: p.vetName, phone: p.vetPhone, address: p.vetAddress }
					: null,
			doses: p.care
				.flatMap((c) => c.occurrences.map((o) => ({ o, c })))
				.sort((a, b) => a.o.dueAt.getTime() - b.o.dueAt.getTime())
				.map(({ o, c }) => ({
					id: o.id,
					title: c.title,
					dose: c.dose,
					notes: c.notes,
					when: fmt(o.dueAt),
					late: o.status === 'PENDING' && o.dueAt < now,
					status: o.status,
					by: o.doneBy?.givenName ?? o.doneByName
				}))
		}))
	};
};

export const actions = {
	give: async ({ params, request }) => {
		const link = await findSitterLink(params.token);
		if (!link) return fail(404, { error: 'This link has expired.' });
		const id = String((await request.formData()).get('id') ?? '');
		const now = Date.now();
		const occ = await prisma.occurrence.findFirst({
			where: {
				id,
				status: 'PENDING',
				careItem: { pet: { householdId: link.householdId } },
				dueAt: { gte: new Date(now - WINDOW_BACK), lte: new Date(now + WINDOW_AHEAD) }
			}
		});
		if (!occ) return fail(400, { error: 'That dose has already been given or isn’t due yet.' });
		await prisma.$transaction([
			prisma.occurrence.update({
				where: { id },
				data: {
					status: 'DONE',
					doneAt: new Date(),
					doneByName: link.sitterName,
					snoozedUntil: null
				}
			}),
			prisma.careItem.updateMany({
				where: { id: occ.careItemId, stock: { gt: 0 } },
				data: { stock: { decrement: 1 } }
			})
		]);
		await checkRefill(occ.careItemId);
		return { given: id };
	}
} satisfies Actions;
