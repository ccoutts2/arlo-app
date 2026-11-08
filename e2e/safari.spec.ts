import { devices, expect, test } from '@playwright/test';
import { addDog, signUp } from './helpers';
test.use({ ...devices['iPhone 13 Mini'], browserName: 'webkit' });
// Safari draws date/time pickers natively; Chrome-only tests missed them overflowing on iPhone.
test('date and time inputs fit their cards in Safari @phone', async ({ page }) => {
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	const fits = async (name: string) => {
		const overflow = await page.evaluate(() =>
			[...document.querySelectorAll('input[type=date],input[type=time]')].map((i) => {
				const r = i.getBoundingClientRect(),
					p = i.closest('.paper, form')!.getBoundingClientRect();
				return Math.round(r.right - p.right);
			})
		);
		for (const o of overflow) expect(o, name).toBeLessThanOrEqual(0);
	};
	await page.goto('/household/notifications');
	await page.getByLabel('From').scrollIntoViewIfNeeded();
	await fits('quiet hours');
	await page.goto(`/pets/${pet}/edit`);
	await page.getByLabel('Birthday').scrollIntoViewIfNeeded();
	await fits('pet form');
	await page.goto(`/pets/${pet}/care/new`);
	await page.getByLabel('Starting').scrollIntoViewIfNeeded();
	await fits('care form');
});
