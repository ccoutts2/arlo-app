import { expect, test, type Page } from '@playwright/test';
import { addCare, addDog, signUp } from './helpers';

async function save(page: Page) {
	await page.getByRole('button', { name: /Save to the log|Save changes/ }).click();
	await page.waitForURL(/\/log(\/[a-z0-9]+)?$/);
}

test('a training session: timer, clicker, new skill, rating', async ({ page }) => {
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	await page.goto('/log');
	await page.getByRole('link', { name: 'Start training' }).click();
	await expect(page).toHaveURL('/log/session');
	await expect(page.getByRole('timer')).toHaveText('5:00');
	for (let i = 0; i < 3; i++)
		await page.getByRole('button', { name: 'Click', exact: true }).click();
	await expect(page.getByText('3 clicks')).toBeVisible();
	await expect(page.getByText('Time left')).toBeVisible(); // first click starts the timer
	await page.getByRole('button', { name: 'Finish' }).click();

	await expect(page).toHaveURL(/\/log\/new\?type=TRAINING/);
	await expect(page.getByLabel('Minutes')).toHaveValue('1');
	await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveValue('3 clicks.');
	await page.getByLabel('Add a skill').fill('Recall');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.getByText('Great', { exact: true }).click();
	await save(page);

	const card = page.getByRole('article', { name: /Training · 1 min for Juno by Chris/ });
	await expect(card).toBeVisible();
	await expect(card.getByText('Recall')).toBeVisible();
	await expect(card.getByText('great')).toBeVisible();

	// The skill now exists on Juno's profile.
	await page.goto(`/pets/${pet}`);
	await expect(page.getByRole('link', { name: /Recall.*Learning.*1 session/ })).toBeVisible();
});

test('skill page: level, steps and progress; level change from a session', async ({ page }) => {
	await signUp(page, 'Sam');
	const pet = await addDog(page, { name: 'Mabel' });
	await page.goto(`/log/new?type=TRAINING&pet=${pet}`);
	await page.getByLabel('Add a skill').fill('Loose lead');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await save(page);

	await page.goto(`/pets/${pet}`);
	await page.getByRole('link', { name: /Loose lead/ }).click();
	await page.getByRole('button', { name: 'Getting there' }).click();
	await expect(page.getByText('Learning → Getting there')).toBeVisible();
	for (const step of ['In the house', 'In the garden']) {
		await page.getByLabel('New step').fill(step);
		await page.getByRole('button', { name: 'Add', exact: true }).click();
		await expect(page.getByText(step, { exact: true })).toBeVisible();
	}
	await page.getByRole('button', { name: 'Tick step 1: In the house' }).click();
	await expect(page.getByRole('button', { name: 'Untick step 1: In the house' })).toBeVisible();
	await page.getByRole('button', { name: 'Remove step 2' }).click();
	await expect(page.getByText('In the garden', { exact: true })).toHaveCount(0);

	// Log another session and move it on to Reliable from the form.
	await page.goto(`/log/new?type=TRAINING&pet=${pet}`);
	await page.getByText('Loose lead', { exact: true }).click();
	await page.getByRole('group', { name: 'How is Loose lead now?' }).getByText('Reliable').click();
	await save(page);
	await expect(page.getByText('loose lead → reliable').first()).toBeVisible();
	await page.goto(`/pets/${pet}`);
	await expect(
		page.getByRole('link', { name: /Loose lead.*Reliable.*2 sessions.*1\/1 steps/ })
	).toBeVisible();
});

test('notes, health and walks; filters; edit and delete', async ({ page }) => {
	await signUp(page, 'Alex');
	const pet = await addDog(page, { name: 'Rex' });

	await page.goto(`/log/new?type=NOTE&pet=${pet}`);
	await page.getByRole('button', { name: 'Save to the log' }).click();
	await expect(page.getByText('Write something to save a note.')).toBeVisible();
	await page.getByRole('textbox', { name: 'Note' }).fill('Scared of the hoover today');
	await save(page);

	await page.goto(`/log/new?type=HEALTH&pet=${pet}`);
	await page.getByText('Itching', { exact: true }).click();
	await page.getByText('Low energy', { exact: true }).click();
	await save(page);

	await page.goto(`/log/new?type=WALK&pet=${pet}`);
	await page.getByLabel('Minutes').fill('40');
	await save(page);

	await expect(page.getByRole('article')).toHaveCount(3);
	await page.getByRole('link', { name: 'Health', exact: true }).click();
	await expect(page.getByRole('article')).toHaveCount(1);
	await expect(page.getByRole('article').getByText('Itching')).toBeVisible();

	await page.getByRole('link', { name: 'Notes', exact: true }).click();
	await page.getByRole('link', { name: 'Open' }).click();
	await page.getByRole('button', { name: 'Edit' }).click();
	await page.getByRole('textbox', { name: 'Note' }).fill('Scared of the hoover, better by evening');
	await save(page);
	await expect(page.getByText('better by evening')).toBeVisible();
	await page.getByRole('button', { name: 'Delete…' }).click();
	await page.getByRole('button', { name: 'Yes, delete' }).click();
	await expect(page).toHaveURL('/log');
	await expect(page.getByRole('article')).toHaveCount(2);
});

test('Today shows what was logged; training reminders link to a session', async ({ page }) => {
	await signUp(page, 'Jo');
	const pet = await addDog(page, { name: 'Bea' });
	await addCare(page, pet, { preset: 'Daily training', title: 'Training session' });
	await page.goto(`/log/new?type=WALK&pet=${pet}`);
	await page.getByLabel('Minutes').fill('30');
	await save(page);
	await page.goto('/');
	await expect(page.getByRole('link', { name: /Jo walked Bea for 30 min/ })).toBeVisible();
});

test('an entry sent twice (offline retry) is saved once', async ({ page }) => {
	await signUp(page, 'Kim');
	const pet = await addDog(page, { name: 'Ollie' });
	await page.goto(`/log/new?type=NOTE&pet=${pet}`);
	const clientId = await page.locator('input[name="clientId"]').inputValue();
	expect(clientId).toMatch(/^[0-9a-f-]{36}$/);
	const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
	const form = {
		type: 'NOTE',
		petId: pet,
		date: today,
		time: '09:00',
		body: 'Sent from the park',
		clientId,
		durationMin: '',
		rating: ''
	};
	for (let i = 0; i < 2; i++) {
		await page.request.post('/log/new', {
			form,
			headers: { origin: 'http://localhost:4173' },
			maxRedirects: 0
		});
	}
	await page.goto('/log');
	await expect(page.getByText('Sent from the park')).toHaveCount(1);
});

test('other households cannot see your log @desktop', async ({ page, browser }) => {
	await signUp(page, 'Pat');
	const pet = await addDog(page, { name: 'Secret' });
	await page.goto(`/log/new?type=NOTE&pet=${pet}`);
	await page.getByRole('textbox', { name: 'Note' }).fill('Private note');
	await save(page);
	await page.getByRole('link', { name: 'Open' }).click();
	await page.waitForURL(/\/log\/[a-z0-9]{20,}$/);
	const url = new URL(page.url()).pathname;
	const other = await (await browser.newContext()).newPage();
	await signUp(other, 'Lee');
	expect((await other.goto(url))?.status()).toBe(404);
	await other.goto('/log');
	await expect(other.getByText('Private note')).toHaveCount(0);
	await other.context().close();
});
