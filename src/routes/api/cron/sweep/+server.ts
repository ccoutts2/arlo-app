import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';
import { topUp } from '$lib/server/care';
import { bookUpcoming } from '$lib/server/reminders/dispatch';
import type { RequestHandler } from './$types';

// Twice-weekly safety net (vercel.json): generates ahead and books anything now within 7 days
// that has no push booked yet. Vercel cron sends `Authorization: Bearer $CRON_SECRET`.
export const GET: RequestHandler = async ({ request }) => {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`)
		error(401, 'Unauthorised');
	const households = await prisma.household.findMany({ select: { id: true, timezone: true } });
	for (const h of households) await topUp(h.id, h.timezone);
	return json({ households: households.length, booked: await bookUpcoming() });
};
