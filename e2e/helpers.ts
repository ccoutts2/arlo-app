import { expect, type Page } from '@playwright/test';
import { testEmail } from './db';

export const PASSWORD = 'correct-horse-battery';

export async function signUp(page: Page, name: string, path = '/auth/signup') {
	const email = testEmail(name.toLowerCase());
	await page.goto(path);
	await page.getByLabel('First name').fill(name);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Create account' }).click();
	await page.waitForURL((u) => !u.pathname.startsWith('/auth'));
	return email;
}

export async function addDog(
	page: Page,
	fields: { name: string; photo?: boolean; [k: string]: string | boolean | undefined }
) {
	await page.goto('/pets/new');
	await page.getByLabel('Name', { exact: true }).fill(fields.name);
	if (fields.breed) await page.getByLabel('Breed').fill(String(fields.breed));
	if (fields.weight) await page.getByLabel('Weight (kg)').fill(String(fields.weight));
	if (fields.note) await page.getByLabel('A line about them').fill(String(fields.note));
	if (fields.vetName) await page.getByLabel('Practice').fill(String(fields.vetName));
	if (fields.vetPhone) await page.getByLabel('Phone').fill(String(fields.vetPhone));
	if (fields.photo) {
		await page.getByLabel('Photo of your dog').setInputFiles('e2e/fixtures/dog.jpg');
		await expect(page.getByText('Change', { exact: true })).toBeAttached();
	}
	await page.getByRole('button', { name: 'Add to the sheet' }).click();
	await page.waitForURL(/\/pets\/(?!new$)[a-z0-9]+$/);
	return page.url().split('/').pop()!;
}

export async function addCare(
	page: Page,
	petId: string,
	o: {
		preset?: string;
		title: string;
		dose?: string;
		stock?: string;
		repeat?: string;
		times?: string[];
	}
) {
	await page.goto(`/pets/${petId}/care/new`);
	if (o.preset) await page.getByRole('button', { name: new RegExp(o.preset) }).click();
	await page.getByLabel('Name', { exact: true }).fill(o.title);
	if (o.dose) await page.getByLabel('Dose', { exact: true }).fill(o.dose);
	if (o.repeat) await page.getByText(o.repeat, { exact: true }).click();
	if (o.times) {
		for (const [i, t] of o.times.entries()) await page.getByLabel(`Time ${i + 1}`).fill(t);
	}
	if (o.stock) await page.getByLabel('Doses left (optional)').fill(o.stock);
	await page.getByRole('button', { name: 'Add to the sheet' }).click();
	await page.waitForURL(`/pets/${petId}`);
}
