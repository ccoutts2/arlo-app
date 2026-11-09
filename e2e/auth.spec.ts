import { expect, test } from '@playwright/test';
import { PASSWORD, signUp } from './helpers';

test('signed-out visitors see the welcome page, then log in', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Who fed the\s+dog\?/);
	await page.getByRole('banner').getByRole('link', { name: 'Log in' }).click();
	await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
	await page.goto('/log');
	await expect(page).toHaveURL(/\/auth\/login$/);
});

test('sign-up validates before creating an account', async ({ page }) => {
	await page.goto('/auth/signup');
	await page.getByLabel('Email').fill('not-an-email');
	await page.getByLabel('Password').fill('short');
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByText('Tell us your first name.')).toBeVisible();
	await expect(page.getByText('Enter a valid email address.')).toBeVisible();
	await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
	await expect(page).toHaveURL(/signup/);
});

test('sign-up creates a household and lands on Today', async ({ page }) => {
	await signUp(page, 'Chris');
	await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible();
	await expect(page.getByText('Your sheet is empty')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Household: Chris' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
});

test('duplicate email is refused', async ({ page, browser }) => {
	const email = await signUp(page, 'Sam');
	const other = await browser.newPage();
	await other.goto('/auth/signup');
	await other.getByLabel('First name').fill('Sam');
	await other.getByLabel('Email').fill(email);
	await other.getByLabel('Password').fill(PASSWORD);
	await other.getByRole('button', { name: 'Create account' }).click();
	await expect(other.getByRole('alert')).toHaveText(/already has an account/);
	await other.close();
});

test('tabs navigate, household lists you, log out and back in', async ({ page }) => {
	const email = await signUp(page, 'Alex');
	await page.getByRole('link', { name: 'Household' }).click();
	await expect(page).toHaveURL('/household');
	await expect(page.getByText('Alex (you)')).toBeVisible();
	await expect(page.getByLabel('Household name')).toHaveValue('Alex’s household');
	for (const [name, url] of [
		['Log', '/log'],
		['Dogs', '/pets'],
		['Today', '/']
	] as const) {
		await page.getByRole('link', { name, exact: true }).click();
		await expect(page).toHaveURL(url);
		await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute(
			'aria-current',
			'page'
		);
	}
	await page.getByRole('link', { name: 'Household' }).click();
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/auth\/login$/);
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);
	await page.goto('/auth/login');

	await page.getByLabel('Email').fill(email.toUpperCase());
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/');
});

test('wrong passwords are throttled after five attempts', async ({ page }) => {
	const email = await signUp(page, 'Jo');
	await page.context().clearCookies();
	await page.goto('/auth/login');
	for (let i = 0; i < 5; i++) {
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill('wrong-password');
		await page.getByRole('button', { name: 'Log in' }).click();
		await expect(page.getByRole('alert')).toBeVisible();
	}
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByRole('alert')).toHaveText(/Too many wrong passwords/);
	await expect(page).toHaveURL(/login/);
});

test('PWA manifest and icons are served', async ({ request }) => {
	const res = await request.get('/manifest.webmanifest');
	expect(res.ok()).toBe(true);
	const manifest = await res.json();
	expect(manifest.name).toBe('Lead');
	expect(manifest.display).toBe('standalone');
	for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
	expect((await request.get('/icons/apple-touch-icon.png')).ok()).toBe(true);
});
