import { error } from '@sveltejs/kit';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import prisma from '$lib/server/prisma';
import { patternOf } from '$lib/server/care';
import { dueTimes } from '$lib/schedule';
import { addDays, localParts } from '$lib/time';
import { buildIcs, type IcsEvent } from '$lib/ics';
import { careTypeLabel, type CareTypeKey } from '$lib/care';
import type { RequestHandler } from './$types';

// A private calendar subscription (webcal://…/api/calendar/<token>.ics). Appointments and the less
// frequent treatments only: daily meds would flood a calendar and already live on the sheet.
export const GET: RequestHandler = async ({ params, url }) => {
	const token = params.file.replace(/\.ics$/, '');
	const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const user = await prisma.user.findUnique({
		where: { calendarTokenHash: tokenHash },
		include: { memberships: { include: { household: true }, take: 1 } }
	});
	const household = user?.memberships[0]?.household;
	if (!household) error(404, 'Not found');

	const tz = household.timezone;
	const today = localParts(new Date(), tz).date;
	const items = await prisma.careItem.findMany({
		where: { active: true, repeat: { not: 'DAILY' }, pet: { householdId: household.id } },
		include: { pet: { select: { id: true, name: true } } }
	});
	const events: IcsEvent[] = items.flatMap((item) =>
		dueTimes(patternOf(item), addDays(today, -30), addDays(today, 365), tz).map((start) => ({
			uid: `${item.id}-${start.getTime()}`,
			start,
			minutes: item.type === 'APPOINTMENT' ? 60 : 15,
			summary: `${item.title} · ${item.pet.name}`,
			description: [careTypeLabel[item.type as CareTypeKey], item.dose, item.notes]
				.filter(Boolean)
				.join('\n'),
			url: `${url.origin}/pets/${item.pet.id}`
		}))
	);
	return new Response(buildIcs(`${household.name} · Lead`, events), {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': 'inline; filename="lead.ics"',
			'cache-control': 'private, max-age=900'
		}
	});
};
