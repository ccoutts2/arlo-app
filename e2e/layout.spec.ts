import { expect, test } from '@playwright/test';
import { addCare, addDog, signUp } from './helpers';
import { insertLateDose } from './db';

// Every screen must fit the smallest phones we support (320 px, iPhone SE 1st gen) without
// sideways scrolling. Overflow shifts the page on iOS and makes taps land in the wrong place.
const WIDTHS = [320, 375, 390];

test('no screen scrolls sideways at 320, 375 or 390 px', async ({ page, browser }, info) => {
	test.skip(info.project.name !== 'iphone', 'phone widths only');
	test.setTimeout(120_000);
	await signUp(page, 'Width');
	const pet = await addDog(page, {
		name: 'Wide',
		breed: 'Labrador retriever',
		note: 'a long handwritten line here'
	});
	await addCare(page, pet, {
		preset: 'Twice-daily medicine',
		title: 'Apoquel with a long name',
		stock: '30'
	});
	const occ = await insertLateDose(pet, 'Apoquel with a long name');
	const paths = [
		'/',
		'/log',
		'/pets',
		'/pets/new',
		`/pets/${pet}`,
		`/pets/${pet}/edit`,
		`/pets/${pet}/care/new`,
		`/o/${occ}`,
		'/household',
		'/household/notifications',
		'/log/new',
		'/log/session',
		'/log/places',
		'/log/places/new',
		'/install',
		`/pets/${pet}/summary`
	];
	const cookies = await page.context().cookies();

	for (const width of WIDTHS) {
		const ctx = await browser.newContext({
			viewport: { width, height: 700 },
			isMobile: true,
			hasTouch: true,
			deviceScaleFactor: 2
		});
		await ctx.addCookies(cookies);
		const p = await ctx.newPage();
		for (const path of [...paths, '/welcome', '/auth/login', '/auth/signup']) {
			if (path.startsWith('/auth') || path === '/welcome') await ctx.clearCookies();
			await p.goto(path);
			const docW = await p.evaluate(() => document.documentElement.scrollWidth);
			expect(docW, `${path} at ${width}px`).toBeLessThanOrEqual(width);
		}
		await ctx.close();
	}
});
