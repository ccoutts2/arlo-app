import { expect, test } from '@playwright/test';
import { addDog, signUp } from './helpers';

test('log entries made offline are kept on the phone and sync once back online @phone', async ({
	page,
	context
}) => {
	test.setTimeout(90_000);
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });

	// Online: let the service worker take control, then open the log screens so they're kept.
	await page.goto('/log');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	for (const path of ['/log', `/log/new?type=NOTE&pet=${pet}`, '/log/session']) {
		await page.goto(path);
		await expect
			.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
			.toBe(true);
	}

	await context.setOffline(true);

	// A note, written with no signal.
	await page.goto(`/log/new?type=NOTE&pet=${pet}`);
	await page.getByRole('textbox', { name: 'Note' }).fill('Written in the park with no signal');
	await page.getByRole('button', { name: 'Save to the log' }).click();
	await expect(page).toHaveURL('/log');
	await expect(page.getByRole('status').filter({ hasText: 'You’re offline' })).toBeVisible();
	await expect(page.getByText(/1\s*entry is saved on this phone/)).toBeVisible();

	// A training session, timed and clicked with no signal.
	await page.goto('/log/session');
	await page.getByRole('button', { name: 'Click', exact: true }).click();
	await page.getByRole('button', { name: 'Click', exact: true }).click();
	await page.getByRole('button', { name: 'Finish' }).click();
	await expect(page.getByLabel('Minutes')).toHaveValue('1');
	await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveValue('2 clicks.');
	await page.getByLabel('Add a skill').fill('Recall');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.getByRole('button', { name: 'Save to the log' }).click();
	await expect(page.getByText(/2\s*entries are saved on this phone/)).toBeVisible();

	// Back online: both sync, once each.
	await context.setOffline(false);
	await expect(page.getByText(/saved on this phone/)).toHaveCount(0, { timeout: 15_000 });
	await page.reload();
	await expect(page.getByText('Written in the park with no signal')).toHaveCount(1);
	await expect(
		page.getByRole('article', { name: /Training · 1 min for Juno by Chris/ })
	).toHaveCount(1);
	await expect(page.getByRole('article').getByText('Recall')).toBeVisible();
});
