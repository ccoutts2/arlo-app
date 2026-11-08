import { error, json } from '@sveltejs/kit';
import { z } from 'zod/v4';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

const subSchema = z.object({
	endpoint: z.url().max(1000),
	keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) })
});

const label = (ua: string) =>
	/iPhone/.test(ua)
		? 'iPhone'
		: /iPad/.test(ua)
			? 'iPad'
			: /Android/.test(ua)
				? 'Android'
				: /Mac/.test(ua)
					? 'Mac'
					: /Windows/.test(ua)
						? 'Windows'
						: 'Browser';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Log in first');
	const parsed = subSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Invalid subscription');
	const { endpoint, keys } = parsed.data;
	const data = {
		userId: locals.user.id,
		p256dh: keys.p256dh,
		auth: keys.auth,
		label: label(request.headers.get('user-agent') ?? ''),
		failures: 0
	};
	await prisma.pushSubscription.upsert({
		where: { endpoint },
		create: { endpoint, ...data },
		update: data
	});
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Log in first');
	const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
	if (endpoint)
		await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: locals.user.id } });
	return json({ ok: true });
};
