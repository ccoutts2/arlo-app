import { expect, test } from '@playwright/test';
import { addCare, addDog, signUp } from './helpers';
import { db, insertLateDose } from './db';

test('running low: threshold, Today card and restock', async ({ page }) => {
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Apoquel', stock: '3' });
	// The default reorder point is 5, so 3 left is already low.
	await page.goto('/');
	const card = page.getByRole('region', { name: 'Apoquel is running low' });
	await expect(card).toBeVisible();
	await expect(card.getByText('3 left')).toBeVisible();
	await card.getByLabel('New pack').fill('30');
	await card.getByRole('button', { name: 'Restocked' }).click();
	await expect(card).toHaveCount(0);
	await page.goto(`/pets/${pet}`);
	await expect(page.getByText(/33 left/)).toBeVisible();
});

test('giving the dose that reaches the threshold flags it once', async ({ page }) => {
	await signUp(page, 'Sam');
	const pet = await addDog(page, { name: 'Mabel' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Drops', stock: '6' });
	const occ = await insertLateDose(pet, 'Drops');
	await page.goto(`/o/${occ}`);
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('?/give')),
		page.getByRole('button', { name: 'Mark given', exact: true }).click()
	]);
	const prisma = db();
	const item = await prisma.careItem.findFirstOrThrow({ where: { petId: pet, title: 'Drops' } });
	await prisma.$disconnect();
	expect(item.stock).toBe(5);
	expect(item.refillNotifiedAt).not.toBeNull();
});

test('weight log with a trend', async ({ page }) => {
	await signUp(page, 'Alex');
	const pet = await addDog(page, { name: 'Rex' });
	await page.goto(`/pets/${pet}`);
	for (const kg of ['24.1', '24,6']) {
		await page.getByLabel('Weight today (kg)').fill(kg);
		await page.getByRole('button', { name: 'Add', exact: true }).first().click();
		await expect(page.getByLabel('Weight today (kg)')).toHaveValue('');
	}
	await expect(
		page.getByRole('img', { name: 'Weight over time, from 24.1 kg to 24.6 kg' })
	).toBeVisible();
	await expect(page.getByText(/Up 0\.5 kg since/)).toBeVisible();
	await expect(page.getByText('24.6 kg').first()).toBeVisible();
});

test('sitter link: card, mark given as the sitter, cancel', async ({ page, browser }) => {
	await signUp(page, 'Jo');
	const pet = await addDog(page, { name: 'Bea', photo: true });
	await page.goto(`/pets/${pet}/edit`);
	await page.getByLabel('Notes for sitters').fill('Breakfast at 7, one scoop.');
	await page.getByLabel('Allergies').fill('Chicken');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Joint pill' });
	await insertLateDose(pet, 'Joint pill', 30);

	await page.goto('/household');
	await page.getByLabel('Sitter’s name').fill('Emma');
	await page.getByRole('button', { name: 'Create sitter link' }).click();
	const url = new URL(await page.getByLabel('Link for Emma').inputValue()).pathname;

	const sitter = await (await browser.newContext()).newPage(); // no account
	await sitter.goto(url);
	await expect(sitter.getByRole('heading', { name: 'Looking after Bea' })).toBeVisible();
	await expect(sitter.getByText('Allergies: Chicken')).toBeVisible();
	await expect(sitter.getByText('Breakfast at 7, one scoop.')).toBeVisible();
	await expect
		.poll(() =>
			sitter
				.getByRole('img', { name: 'Bea' })
				.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)
		)
		.toBeGreaterThan(0);
	await sitter.getByRole('button', { name: 'Given' }).first().click();
	await expect(sitter.getByText('Given by Emma')).toBeVisible();

	// The owner sees Emma's name on Today.
	await page.goto('/');
	await expect(page.getByText(/given by Emma/)).toBeVisible();

	// Cancel the link: the sitter page stops working.
	await page.goto('/household');
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('?/revokeSitter')),
		page
			.getByRole('region', { name: 'Sitter link' })
			.getByRole('button', { name: 'Cancel' })
			.click()
	]);
	await sitter.reload();
	await expect(sitter.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
	await sitter.context().close();
});

test('calendar feed lists appointments and less frequent treatments, not daily meds @desktop', async ({
	page
}) => {
	await signUp(page, 'Kim');
	const pet = await addDog(page, { name: 'Ollie' });
	await addCare(page, pet, { preset: 'Yearly booster', title: 'Booster vaccine' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Daily pill' });
	await page.goto('/household');
	await page.getByRole('button', { name: 'Create calendar link' }).click();
	const feed = await page.getByLabel(/paste this into another calendar app/).inputValue();
	expect(feed).toMatch(/\/api\/calendar\/[a-z0-9]+\.ics$/);
	const anon = await page.context().browser()!.newContext();
	const res = await anon.request.get(new URL(feed).pathname.replace(/^/, 'http://localhost:4173'));
	expect(res.headers()['content-type']).toContain('text/calendar');
	const ics = await res.text();
	expect(ics).toContain('SUMMARY:Booster vaccine · Ollie');
	expect(ics).not.toContain('Daily pill');
	await anon.close();
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('?/calendarOff')),
		page.getByRole('region', { name: 'Calendar' }).getByRole('button', { name: 'Turn off' }).click()
	]);
	expect((await page.request.get(new URL(feed).pathname)).status()).toBe(404);
});

test('vet summary and CSV exports @desktop', async ({ page }) => {
	await signUp(page, 'Pat');
	const pet = await addDog(page, { name: 'Max', breed: 'Collie' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Metacam', dose: '1.5 ml' });
	const occ = await insertLateDose(pet, 'Metacam');
	await page.goto(`/o/${occ}`);
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('?/give')),
		page.getByRole('button', { name: 'Mark given', exact: true }).click()
	]);

	await page.goto(`/pets/${pet}`);
	await page.getByRole('link', { name: /Summary for the vet/ }).click();
	await expect(page.getByRole('heading', { name: 'Max', level: 1 })).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Metacam' }).first()).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Pat' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();

	const doses = await page.request.get('/api/export/doses.csv');
	expect(doses.headers()['content-disposition']).toContain('lead-doses.csv');
	const text = await doses.text();
	expect(text.split('\r\n')[0]).toBe('"Due","Dog","Treatment","Dose","Status","Done at","By"');
	expect(text).toContain('"Max","Metacam","1.5 ml","Given"');
	expect((await page.request.get('/api/export/log.csv')).ok()).toBe(true);
	expect((await page.request.get('/api/export/secrets.csv')).status()).toBe(404);
});
