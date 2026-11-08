import { expect, test, type Page } from '@playwright/test';
import { addCare, addDog, signUp } from './helpers';
import { insertLateDose } from './db';

/** Clicks a form button and waits for the server to answer (the screen updates optimistically). */
const submit = (page: Page, name: string, action: string) =>
	Promise.all([
		page.waitForResponse((r) => r.url().includes(`?/${action}`) && r.request().method() === 'POST'),
		page.getByRole('button', { name, exact: true }).click()
	]);

test('add a twice-daily medicine from a preset', async ({ page }) => {
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	await expect(page.getByText('Nothing on Juno’s sheet yet.')).toBeVisible();
	await addCare(page, pet, {
		preset: 'Twice-daily medicine',
		title: 'Apoquel',
		dose: '16 mg tablet',
		stock: '30'
	});

	await expect(
		page.getByRole('link', { name: /Apoquel.*Twice a day at 08:00 and 20:00 · 30 left/ })
	).toBeVisible();
	await page.getByRole('link', { name: 'Today', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'This week’s sheet' })).toBeVisible();
	// Which rows appear depends on what's left of this week (e.g. on a Sunday afternoon only
	// 20:00 remains), so check the sheet has Apoquel rows at the scheduled times only.
	const rows = page.getByRole('rowheader').filter({ hasText: 'Apoquel' });
	await expect(rows.first()).toBeVisible();
	for (const text of await rows.allTextContents()) expect(text).toMatch(/08:00|20:00/);
});

test('the care form explains mistakes', async ({ page }) => {
	await signUp(page, 'Sam');
	const pet = await addDog(page, { name: 'Mabel' });
	await page.goto(`/pets/${pet}/care/new`);
	await page.getByRole('button', { name: '+ Add a time' }).click();
	await page.getByLabel('Time 2').fill('08:00');
	await page.getByRole('button', { name: 'Add to the sheet' }).click();
	await expect(page.getByText('Give it a name, like “Apoquel”.')).toBeVisible();
	await page.getByLabel('Name', { exact: true }).fill('Drops');
	await page.getByRole('button', { name: 'Add to the sheet' }).click();
	await expect(page.getByText('Each time should be different.')).toBeVisible();
});

test('a late dose: badge, mark given with the tick, stock counts down, partner sees it', async ({
	page,
	browser
}) => {
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	await addCare(page, pet, { preset: 'Twice-daily medicine', title: 'Apoquel', stock: '10' });
	const occId = await insertLateDose(pet, 'Apoquel');

	await page.goto('/');
	await expect(page.getByText('1 late', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: /Today.*1 late/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Apoquel' })).toBeVisible();
	await expect(page.getByRole('cell', { name: /late/ }).first()).toBeVisible();

	await page.getByRole('link', { name: 'Mark given' }).click();
	await expect(page).toHaveURL(`/o/${occId}`);
	await expect(page.getByText(/1 h 12 m late|1 h 1[0-9] m late/)).toBeVisible();
	await expect(page.getByRole('status')).toHaveText('Nobody has given this yet.');
	await submit(page, 'Mark given', 'give');
	await expect(page.getByRole('status')).toHaveText(/Given by you at/);
	await expect(page.getByText('9 left')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();

	await page.getByRole('link', { name: 'Back to today' }).click();
	await expect(page.getByText('1 late', { exact: true })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Today.*late/ })).toHaveCount(0);
	await expect(page.getByRole('cell', { name: /given by C/ })).toBeVisible();

	// Invite Sam; Sam sees Chris's tick.
	await page.goto('/household');
	await page.getByRole('button', { name: 'Create invite link' }).click();
	const link = new URL(await page.getByLabel('Invite link, valid for 7 days').inputValue())
		.pathname;
	const sam = await (await browser.newContext()).newPage();
	await sam.goto(link);
	await sam.getByRole('link', { name: 'Create an account to join' }).click();
	await sam.waitForURL(/\/auth\/signup\?invite=/);
	await signUp(sam, 'Sam', sam.url().replace('http://localhost:4173', ''));
	await sam.goto(`/o/${occId}`);
	await expect(sam.getByRole('status')).toHaveText(/Given by Chris at/);
	await sam.context().close();
});

test('undo, snooze from Today, and skip', async ({ page }) => {
	await signUp(page, 'Alex');
	const pet = await addDog(page, { name: 'Rex' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Joint tablet' });
	const occId = await insertLateDose(pet, 'Joint tablet', 30);

	await page.goto(`/o/${occId}`);
	await submit(page, 'Mark given', 'give');
	await expect(page.getByRole('status')).toHaveText(/Given by you/);
	await submit(page, 'Undo', 'undo');
	await expect(page.getByRole('status')).toHaveText('Nobody has given this yet.');

	await page.goto('/');
	await submit(page, 'Snooze', 'snooze');
	await expect(page.getByText(/snoozed till \d\d:\d\d/)).toBeVisible();
	await expect(page.getByText('1 late', { exact: true })).toHaveCount(0);

	await page.goto(`/o/${occId}`);
	await submit(page, 'Skip', 'skip');
	await expect(page.getByRole('status')).toHaveText('Skipped by Alex.');
});

test('tick a dose straight from the list', async ({ page }) => {
	await signUp(page, 'Jo');
	const pet = await addDog(page, { name: 'Bea' });
	const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
	await addCare(page, pet, { preset: 'Vet visit', title: 'Check-up', times: ['23:59'] });
	await page.goto('/');
	const row = page.getByRole('listitem').filter({ hasText: 'Check-up' });
	await expect(row).toBeVisible();
	await row.getByRole('button', { name: 'Mark Check-up given' }).click();
	await expect(page.getByRole('heading', { name: 'Done today' })).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'given by Jo' })).toBeVisible();
	expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('edit the schedule, then take it off the sheet', async ({ page }) => {
	await signUp(page, 'Kim');
	const pet = await addDog(page, { name: 'Ollie' });
	await addCare(page, pet, { preset: 'Wormer', title: 'Milbemax' });
	await expect(page.getByText('Every 3 months at 09:00')).toBeVisible();
	await page.getByRole('link', { name: /Milbemax/ }).click();
	await page.getByLabel('Every').fill('1');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Every month at 09:00')).toBeVisible();
	await page.getByRole('link', { name: /Milbemax/ }).click();
	await page.getByRole('button', { name: 'Remove Milbemax…' }).click();
	await page.getByRole('button', { name: 'Yes, remove it' }).click();
	await expect(page.getByText('Nothing on Ollie’s sheet yet.')).toBeVisible();
});

test('doses in other households are not visible', async ({ page, browser }) => {
	await signUp(page, 'Pat');
	const pet = await addDog(page, { name: 'Secret' });
	await addCare(page, pet, { preset: 'Daily medicine', title: 'Pill' });
	const occId = await insertLateDose(pet, 'Pill');
	const other = await (await browser.newContext()).newPage();
	await signUp(other, 'Lee');
	expect((await other.goto(`/o/${occId}`))?.status()).toBe(404);
	await other.context().close();
});
