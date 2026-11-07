import { expect, test } from '@playwright/test';
import { addDog, signUp } from './helpers';

test('add a dog with a photo, see it everywhere', async ({ page }) => {
	await signUp(page, 'Chris');
	await page.getByRole('link', { name: 'Add your dog' }).click();
	await expect(page).toHaveURL('/pets/new');
	const id = await addDog(page, {
		name: 'Juno',
		breed: 'Labrador retriever',
		weight: '24,6',
		note: 'hates the ear drops',
		vetName: 'Riverside Vets',
		vetPhone: '01632 960418',
		photo: true
	});

	await expect(page.getByRole('heading', { name: 'Juno', level: 1 })).toBeVisible();
	await expect(page.getByText('hates the ear drops')).toBeVisible();
	await expect(page.getByText('24.6 kg')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:01632960418');
	const photo = page.getByRole('img', { name: 'Juno' });
	await expect(photo).toBeVisible();
	await expect
		.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
		.toBeGreaterThan(0);

	await page.getByRole('link', { name: 'Dogs', exact: true }).click();
	await expect(page.getByRole('link', { name: /Juno/ })).toBeVisible();
	await page.getByRole('link', { name: 'Today', exact: true }).click();
	await expect(page.getByRole('link', { name: 'Juno' })).toHaveAttribute('href', `/pets/${id}`);
	await expect(page.getByText('Add Juno’s first treatment')).toBeVisible();
});

test('the dog form explains mistakes and keeps what you typed', async ({ page }) => {
	await signUp(page, 'Sam');
	await page.goto('/pets/new');
	await page.getByLabel('Breed').fill('Pug');
	await page.getByLabel('Weight (kg)').fill('heavy');
	await page.getByRole('button', { name: 'Add to the sheet' }).click();
	await expect(page.getByText('What’s your dog called?')).toBeVisible();
	await expect(page.getByText('Enter a weight in kg, like 24.6.')).toBeVisible();
	await expect(page.getByLabel('Breed')).toHaveValue('Pug');
});

test('edit a dog, then remove it', async ({ page }) => {
	await signUp(page, 'Alex');
	const id = await addDog(page, { name: 'Mabel', breed: 'Pug' });
	await page.getByRole('link', { name: 'Edit' }).click();
	await expect(page).toHaveURL(`/pets/${id}/edit`);
	await page.getByLabel('Weight (kg)').fill('8.2');
	await page
		.getByRole('button', { name: 'Girl' })
		.or(page.getByText('Girl', { exact: true }))
		.click();
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page).toHaveURL(`/pets/${id}`);
	await expect(page.getByText('8.2 kg')).toBeVisible();
	await expect(page.getByText('Girl', { exact: true })).toBeVisible();

	await page.goto(`/pets/${id}/edit`);
	await page.getByRole('button', { name: 'Remove Mabel…' }).click();
	await page.getByRole('button', { name: 'Yes, remove Mabel' }).click();
	await expect(page).toHaveURL('/pets');
	await expect(page.getByText('No dogs yet')).toBeVisible();
});

test('other households cannot see your dog or its photo', async ({ page, browser }) => {
	await signUp(page, 'Owner');
	const id = await addDog(page, { name: 'Private', photo: true });
	const photoSrc = await page.getByRole('img', { name: 'Private' }).getAttribute('src');

	const stranger = await browser.newPage();
	await signUp(stranger, 'Stranger');
	expect((await stranger.goto(`/pets/${id}`))?.status()).toBe(404);
	expect((await stranger.goto(`/pets/${id}/edit`))?.status()).toBe(404);
	expect((await stranger.request.get(photoSrc!)).status()).toBe(404);

	const anon = await browser.newContext();
	expect((await anon.request.get(`http://localhost:4173${photoSrc}`)).status()).toBe(404);
	await anon.close();
	await stranger.close();
});
