import { sendNotification, setVapidDetails } from 'web-push';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import prisma from '../prisma';

export type PushPayload = {
	title: string;
	body: string;
	url: string;
	tag?: string;
	badge?: number;
};

let configured = false;
function configure() {
	if (configured) return true;
	if (!publicEnv.PUBLIC_VAPID_KEY || !env.VAPID_PRIVATE_KEY) return false;
	setVapidDetails('mailto:hello@lead.app', publicEnv.PUBLIC_VAPID_KEY, env.VAPID_PRIVATE_KEY);
	configured = true;
	return true;
}

/**
 * Sends to every device of these users. Dead subscriptions (404/410: the app was removed or
 * permission revoked) are deleted; other failures are counted so settings can show them.
 */
export async function sendToUsers(userIds: string[], payload: PushPayload) {
	if (!configure()) return { sent: 0, failed: 0, removed: 0 };
	const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
	let sent = 0,
		failed = 0,
		removed = 0;
	await Promise.all(
		subs.map(async (s) => {
			try {
				await sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					JSON.stringify(payload),
					{ TTL: 6 * 60 * 60, urgency: 'high', topic: payload.tag?.slice(0, 32) }
				);
				sent++;
				await prisma.pushSubscription.update({
					where: { id: s.id },
					data: { lastSuccessAt: new Date(), failures: 0 }
				});
			} catch (e) {
				const status = (e as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) {
					removed++;
					await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
				} else {
					failed++;
					await prisma.pushSubscription.update({
						where: { id: s.id },
						data: { lastErrorAt: new Date(), failures: { increment: 1 } }
					});
				}
			}
		})
	);
	return { sent, failed, removed };
}
