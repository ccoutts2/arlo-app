import { expect, test, type APIRequestContext } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import { config } from 'dotenv';
import { addCare, addDog, signUp } from './helpers';
import { db, insertLateDose } from './db';

config({ path: '.env.local', quiet: true });
const SECRET = process.env.CRON_SECRET!;

/** A fake push service (like Apple's or Google's) on https://localhost that records deliveries. */
function fakePushService(status = 201) {
	const received: { path: string; encoding?: string; bytes: number }[] = [];
	const server = https.createServer(
		{ key: fs.readFileSync('e2e/.cert/key.pem'), cert: fs.readFileSync('e2e/.cert/cert.pem') },
		(req, res) => {
			let bytes = 0;
			req.on('data', (c) => (bytes += c.length));
			req.on('end', () => {
				received.push({
					path: req.url ?? '',
					encoding: req.headers['content-encoding'] as string,
					bytes
				});
				res.writeHead(status).end();
			});
		}
	);
	return new Promise<{ url: string; received: typeof received; close: () => void }>((resolve) =>
		server.listen(0, () => {
			const port = (server.address() as { port: number }).port;
			resolve({ url: `https://localhost:${port}`, received, close: () => server.close() });
		})
	);
}

/** A browser-style push subscription with real P-256 keys, pointing at the fake service. */
function fakeSubscription(base: string) {
	const ecdh = crypto.createECDH('prime256v1');
	ecdh.generateKeys();
	return {
		endpoint: `${base}/push/${crypto.randomUUID()}`,
		keys: {
			p256dh: ecdh.getPublicKey().toString('base64url'),
			auth: crypto.randomBytes(16).toString('base64url')
		}
	};
}

const dispatch = (
	request: APIRequestContext,
	id: string,
	kind = 'due',
	auth = `Bearer ${SECRET}`
) => request.post('/api/push/dispatch', { data: { id, kind }, headers: { authorization: auth } });

test.describe('push delivery @desktop', () => {
	test('a due dose is pushed, encrypted, to every device in the household, once', async ({
		page
	}) => {
		const push = await fakePushService();
		await signUp(page, 'Chris');
		const pet = await addDog(page, { name: 'Juno' });
		await addCare(page, pet, { preset: 'Daily medicine', title: 'Apoquel', dose: '16 mg' });
		const sub = fakeSubscription(push.url);
		expect((await page.request.post('/api/push/subscribe', { data: sub })).ok()).toBe(true);
		const occ = await insertLateDose(pet, 'Apoquel', 1);

		const first = await (await dispatch(page.request, occ)).json();
		expect(first).toMatchObject({ sent: 1, failed: 0 });
		expect(push.received).toHaveLength(1);
		expect(push.received[0].encoding).toBe('aes128gcm'); // payload is end-to-end encrypted
		expect(push.received[0].bytes).toBeGreaterThan(50);

		// QStash may retry; a second call must not push again.
		expect(await (await dispatch(page.request, occ)).json()).toMatchObject({
			skipped: 'already sent'
		});
		expect(push.received).toHaveLength(1);

		const prisma = db();
		const row = await prisma.occurrence.findUniqueOrThrow({ where: { id: occ } });
		await prisma.$disconnect();
		expect(row.notifiedAt).not.toBeNull();

		// The settings page shows this device as working.
		await page.goto('/household/notifications');
		await expect(page.getByText('Working')).toBeVisible();
		push.close();
	});

	test('a dead device (410 Gone) is removed', async ({ page }) => {
		const push = await fakePushService(410);
		await signUp(page, 'Sam');
		const pet = await addDog(page, { name: 'Mabel' });
		await addCare(page, pet, { preset: 'Daily medicine', title: 'Drops' });
		await page.request.post('/api/push/subscribe', { data: fakeSubscription(push.url) });
		const occ = await insertLateDose(pet, 'Drops', 1);
		expect(await (await dispatch(page.request, occ)).json()).toMatchObject({ sent: 0, removed: 1 });
		const r = await (await page.request.post('/api/push/test')).json();
		expect(r.sent + r.failed + r.removed).toBe(0);
		push.close();
	});

	test('nothing is pushed for a dose already given, and strangers cannot trigger pushes', async ({
		page
	}) => {
		const push = await fakePushService();
		await signUp(page, 'Alex');
		const pet = await addDog(page, { name: 'Rex' });
		await addCare(page, pet, { preset: 'Daily medicine', title: 'Pill' });
		await page.request.post('/api/push/subscribe', { data: fakeSubscription(push.url) });
		const occ = await insertLateDose(pet, 'Pill', 1);

		expect((await dispatch(page.request, occ, 'due', 'Bearer wrong')).status()).toBe(401);
		expect(
			(await page.request.post('/api/push/dispatch', { data: { id: occ, kind: 'due' } })).status()
		).toBe(401);
		expect((await page.request.get('/api/cron/sweep')).status()).toBe(401);

		await page.goto(`/o/${occ}`);
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('?/give')),
			page.getByRole('button', { name: 'Mark given', exact: true }).click()
		]);
		expect(await (await dispatch(page.request, occ)).json()).toMatchObject({
			skipped: 'not pending'
		});
		expect(push.received).toHaveLength(0);
		push.close();
	});

	test('send a test notification and save quiet hours', async ({ page }) => {
		const push = await fakePushService();
		await signUp(page, 'Jo');
		await page.request.post('/api/push/subscribe', { data: fakeSubscription(push.url) });
		expect(await (await page.request.post('/api/push/test')).json()).toMatchObject({ sent: 1 });
		expect(push.received).toHaveLength(1);

		await page.goto('/household');
		await page.getByRole('link', { name: /Notifications/ }).click();
		await page.getByLabel('From').fill('21:30');
		await page.getByLabel('Until').fill('06:45');
		await page.getByLabel(/remind everyone again after/).selectOption('60');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
		await page.reload();
		await expect(page.getByLabel('From')).toHaveValue('21:30');
		await expect(page.getByLabel(/remind everyone again after/)).toHaveValue('60');
		push.close();
	});

	test('the twice-weekly sweep runs with the secret', async ({ request }) => {
		const res = await request.get('/api/cron/sweep', {
			headers: { authorization: `Bearer ${SECRET}` }
		});
		expect(res.ok()).toBe(true);
		expect(await res.json()).toHaveProperty('households');
	});
});

test('the Home Screen guide shows once on a phone, and the full guide is always there', async ({
	page
}, info) => {
	test.skip(info.project.name !== 'iphone', 'phone only');
	await signUp(page, 'Kim', '/auth/signup', { installHint: true });
	const sheet = page.getByRole('dialog', { name: 'Get reminders on your phone' });
	await expect(sheet).toBeVisible();
	await sheet.getByRole('link', { name: 'Show me how' }).click();
	await expect(page).toHaveURL('/install');
	await expect(page.getByRole('heading', { name: 'Add Lead to your Home Screen' })).toBeVisible();
	await expect(page.getByText('Add to Home Screen', { exact: true })).toBeVisible();
	await page.goto('/');
	await expect(sheet).toHaveCount(0);
	await page.reload();
	await expect(sheet).toHaveCount(0);
});
