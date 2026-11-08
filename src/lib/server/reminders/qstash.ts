import { Client, Receiver } from '@upstash/qstash';
import { env } from '$env/dynamic/private';

// QStash's free plan accepts delays up to 7 days; anything later is booked by the sweep.
export const MAX_AHEAD_MS = 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;

/**
 * Where QStash calls back. Only Production books real messages: previews are behind Vercel's
 * login wall (QStash can't reach them) and local dev triggers dispatch directly.
 */
export function callbackBase(): string | null {
	if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
	if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL)
		return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
	return null;
}

let client: Client | null = null;
const qstash = () =>
	env.QSTASH_TOKEN
		? (client ??= new Client({ token: env.QSTASH_TOKEN, baseUrl: env.QSTASH_URL }))
		: null;

export type PushKind = 'due' | 'followup' | 'snooze';

/** Books a dispatch at `at`. Returns the message id, or null if booking isn't available here. */
export async function book(occurrenceId: string, kind: PushKind, at: Date): Promise<string | null> {
	const base = callbackBase();
	const c = qstash();
	if (!base || !c) return null;
	if (at.getTime() - Date.now() > MAX_AHEAD_MS) return null;
	const res = await c.publishJSON({
		url: `${base}/api/push/dispatch`,
		body: { id: occurrenceId, kind },
		notBefore: Math.max(Math.floor(at.getTime() / 1000), Math.floor(Date.now() / 1000)),
		retries: 3,
		// One message per dose and kind, even if booking runs twice.
		deduplicationId: `${occurrenceId}-${kind}-${Math.floor(at.getTime() / 60000)}`
	});
	return res.messageId;
}

export async function cancel(messageIds: (string | null)[]) {
	const c = qstash();
	if (!c) return;
	await Promise.all(
		messageIds
			.filter((m): m is string => Boolean(m))
			.map((id) => c.messages.delete(id).catch(() => {}))
	);
}

/** True if the request came from QStash (signed) or from our own scheduler/tests (CRON_SECRET). */
export async function isTrustedCaller(request: Request, body: string): Promise<boolean> {
	const auth = request.headers.get('authorization');
	if (env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`) return true;
	const signature = request.headers.get('upstash-signature');
	if (!signature || !env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) return false;
	const receiver = new Receiver({
		currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
		nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY
	});
	return receiver.verify({ signature, body }).catch(() => false);
}
