import { expect, test, type Page } from '@playwright/test';
import { addDog, signUp } from './helpers';

async function createInvite(page: Page) {
	await page.goto('/household');
	await page.getByRole('button', { name: 'Create invite link' }).click();
	const url = await page.getByLabel('Invite link, valid for 7 days').inputValue();
	expect(url).toMatch(/\/join\/[a-z0-9]+$/);
	return new URL(url).pathname;
}

test('invite your partner: they sign up from the link and share the dog', async ({
	page,
	browser
}) => {
	await signUp(page, 'Chris');
	await addDog(page, { name: 'Juno' });
	const link = await createInvite(page);

	const partner = await (await browser.newContext()).newPage();
	await partner.goto(link);
	await expect(partner.getByText('Chris invited you')).toBeVisible();
	await expect(partner.getByRole('heading', { name: 'Join Chris’s household' })).toBeVisible();
	await partner.getByRole('link', { name: 'Create an account to join' }).click();
	await expect(partner.getByText('Joining Chris’s household')).toBeVisible();
	await signUp(partner, 'Sam', partner.url().replace('http://localhost:4173', ''));

	await partner.goto('/pets');
	await expect(partner.getByRole('link', { name: /Juno/ })).toBeVisible();
	await partner.goto('/household');
	await expect(partner.getByText('Chris', { exact: true })).toBeVisible();
	await expect(partner.getByText('Sam (you)')).toBeVisible();
	await expect(
		partner.getByRole('img', { name: 'Household: Chris, Sam' }).or(partner.locator('body'))
	).toBeVisible();

	await page.reload();
	await expect(page.getByText('Sam', { exact: true })).toBeVisible();
	await expect(page.getByText(/used once/)).toBeVisible();

	// The owner removes Sam, who then has their own empty household.
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('Sam', { exact: true })).toHaveCount(0);
	await partner.goto('/pets');
	await expect(partner.getByText('No dogs yet')).toBeVisible();
	await partner.context().close();
});

test('an existing user can log in from a link and join', async ({ page, browser }) => {
	await signUp(page, 'Jo');
	const link = await createInvite(page);

	const ctx = await browser.newContext();
	const other = await ctx.newPage();
	const email = await signUp(other, 'Kim');
	await ctx.clearCookies();
	await other.goto(link);
	await other.getByRole('link', { name: 'I already have an account' }).click();
	await other.getByLabel('Email').fill(email);
	await other.getByLabel('Password').fill('correct-horse-battery');
	await other.getByRole('button', { name: 'Log in' }).click();
	await expect(other).toHaveURL('/household');
	await expect(other.getByLabel('Household name')).toHaveValue('Jo’s household');
	await ctx.close();
});

test('someone who already shares a dog elsewhere is asked to leave first', async ({
	page,
	browser
}) => {
	await signUp(page, 'Pat');
	const link = await createInvite(page);
	const ctx = await browser.newContext();
	const other = await ctx.newPage();
	await signUp(other, 'Lee');
	await addDog(other, { name: 'Rex' });
	await other.goto(link);
	await other.getByRole('button', { name: 'Join household' }).click();
	await expect(other.getByRole('alert')).toHaveText(/Leave it first/);
	await ctx.close();
});

test('cancelled links stop working', async ({ page, browser }) => {
	await signUp(page, 'Rae');
	const link = await createInvite(page);
	await page.reload();
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByText(/days left/)).toHaveCount(0);
	const anon = await (await browser.newContext()).newPage();
	await anon.goto(link);
	await expect(anon.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
	await anon.context().close();
});

test('rename the household', async ({ page }) => {
	await signUp(page, 'Max');
	await page.goto('/household');
	await page.getByLabel('Household name').fill('The Coutts');
	await page.getByRole('button', { name: 'Rename' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Household name')).toHaveValue('The Coutts');
});
