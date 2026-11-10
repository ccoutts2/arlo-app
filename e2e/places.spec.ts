import { expect, test, type Page } from '@playwright/test';
import { addDog, signUp } from './helpers';
import { db } from './db';

// Never reach Mapbox from tests: no real map loads or searches.
test.beforeEach(async ({ context }) => {
	await context.route(/mapbox\.com/, (route) => route.abort());
});

async function saveLog(page: Page) {
	await page.getByRole('button', { name: 'Save to the log' }).click();
	await page.waitForURL('/log');
}

test('a walk with a thumbs rating at a new place, using my location', async ({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 51.4101, longitude: -0.3374 });
	await signUp(page, 'Chris');
	const pet = await addDog(page, { name: 'Juno' });
	await page.goto(`/log/new?type=WALK&pet=${pet}`);
	await page.getByLabel('Minutes').fill('45');
	await page.locator('label', { hasText: 'Good' }).click();
	await page.getByText('+ Somewhere new').click();
	await page.getByLabel('Place name').fill('Bushy Park');
	await page.getByRole('button', { name: 'Use my location' }).click();
	await expect(page.getByText('Location saved')).toBeVisible();
	await saveLog(page);

	const card = page.getByRole('article', { name: /Walk · 45 min for Juno/ });
	await expect(card.getByText('Good')).toBeVisible();
	await expect(card.getByText(/Bushy Park/)).toBeVisible();

	await page.getByRole('link', { name: 'Places' }).click();
	await page.getByRole('link', { name: /Bushy Park/ }).click();
	await expect(page.getByText('Been', { exact: true }).first()).toBeVisible();
	// Directions: choose a maps app once, then it's remembered on this phone.
	await page.getByRole('button', { name: 'Directions' }).click();
	const sheet = page.getByRole('dialog', { name: 'Directions to Bushy Park' });
	await expect(sheet.getByRole('link', { name: 'Open in Apple Maps' })).toHaveAttribute(
		'href',
		/maps\.apple\.com\/\?daddr=51\.4101\d*,-0\.3374/
	);
	await expect(sheet.getByRole('link', { name: 'Open in Waze' })).toHaveAttribute(
		'href',
		/waze\.com\/ul\?ll=51\.4101\d*,-0\.3374\d*&navigate=yes/
	);
	const google = sheet.getByRole('link', { name: 'Open in Google Maps' });
	await expect(google).toHaveAttribute(
		'href',
		/google\.com\/maps\/dir\/\?api=1&destination=51\.4101/
	);
	const popup = page.waitForEvent('popup');
	await google.click();
	await (await popup).close();
	await page.reload();
	await expect(page.getByRole('link', { name: 'Directions' })).toHaveAttribute(
		'href',
		/google\.com\/maps\/dir/
	);
	await page.getByRole('button', { name: /Opens Google Maps · change/ }).click();
	await expect(page.getByRole('dialog', { name: 'Directions to Bushy Park' })).toBeVisible();
	await expect(page.getByLabel('1 good')).toBeVisible();
});

test('wishlist: recommended place becomes Been after a walk there', async ({ page }) => {
	await signUp(page, 'Sam');
	const pet = await addDog(page, { name: 'Mabel' });
	await page.goto('/log/places');
	await page.getByRole('link', { name: 'Add', exact: true }).click();
	await page.getByLabel('Name', { exact: true }).fill('Richmond Park');
	await page.getByLabel('Recommended by').fill('Sarah, at the park');
	await page.getByText('Off-lead', { exact: true }).click();
	await page.getByText('Café', { exact: true }).click();
	await page.getByRole('button', { name: 'Save place' }).click();
	await expect(page.getByRole('heading', { name: 'Richmond Park' })).toBeVisible();
	await expect(page.getByText('Wishlist', { exact: true })).toBeVisible();
	await expect(page.getByText('Recommended by Sarah, at the park')).toBeVisible();

	await page.goto('/log/places?status=WISHLIST');
	await expect(page.getByRole('link', { name: /Richmond Park/ })).toBeVisible();
	await page.getByRole('link', { name: /Richmond Park/ }).click();
	await page.getByRole('link', { name: 'Log a walk here' }).click();
	await expect(page.getByLabel('Richmond Park')).toBeChecked();
	await page.locator('label', { hasText: 'In between' }).click();
	await saveLog(page);

	await page.goto('/log/places?status=WISHLIST');
	await expect(page.getByRole('link', { name: /Richmond Park/ })).toHaveCount(0);
	await page.goto('/log/places?status=BEEN');
	await page.getByRole('link', { name: /Richmond Park/ }).click();
	await expect(page.getByLabel('1 in between')).toBeVisible();
	await expect(page.getByRole('article', { name: /Walk for Mabel by Sam/ })).toBeVisible();

	// The dog's profile shows the walk and its favourite places.
	await page.goto(`/pets/${pet}`);
	await expect(page.getByRole('region', { name: 'Walks' }).getByText('1')).toBeVisible();
	await expect(
		page.getByRole('region', { name: 'Walks' }).getByRole('link', { name: /Richmond Park/ })
	).toBeVisible();

	// A long place name wraps inside the diary card instead of spilling out of it.
	const prisma = db();
	await prisma.place.updateMany({
		where: { name: 'Richmond Park' },
		data: { name: 'Tower Hamlets Road / Milton Road, round the back of the allotments' }
	});
	await prisma.$disconnect();
	await page.goto('/log');
	const card = page.getByRole('article', { name: /Walk for Mabel by Sam/ });
	await expect(card).toContainText('round the back of the allotments');
	expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
});

test('removing a place keeps the walk', async ({ page }) => {
	await signUp(page, 'Alex');
	const pet = await addDog(page, { name: 'Rex' });
	await page.goto(`/log/new?type=WALK&pet=${pet}`);
	await page.getByText('+ Somewhere new').click();
	await page.getByLabel('Place name').fill('Canal path');
	await saveLog(page);
	await page.goto('/log/places');
	await page.getByRole('link', { name: /Canal path/ }).click();
	await page.getByRole('button', { name: 'Remove…' }).click();
	await page.getByRole('button', { name: 'Yes, remove' }).click();
	await expect(page).toHaveURL('/log/places');
	await page.goto('/log');
	await expect(page.getByRole('article', { name: /Walk for Rex/ })).toBeVisible();
	await expect(page.getByText(/Canal path/)).toHaveCount(0);
});

test('the map shows place markers once it has a ticket', async ({ page }) => {
	await signUp(page, 'Jo');
	await page.goto('/log/places/new');
	await page.getByLabel('Name', { exact: true }).fill('Home Park');
	await page.getByRole('button', { name: 'Save place' }).click();
	await page.waitForURL(/\/log\/places\/(?!new$)[a-z0-9]+$/);
	const prisma = db();
	await prisma.place.updateMany({ where: { name: 'Home Park' }, data: { lat: 51.4, lng: -0.31 } });
	await prisma.$disconnect();
	await page.goto('/log/places');
	await expect(page.getByRole('button', { name: 'Home Park, on the wishlist' })).toBeAttached();
	// The map must have real height (Mapbox restyles its container; a collapsed one hides everything).
	expect((await page.getByRole('region', { name: 'Map' }).boundingBox())!.height).toBeGreaterThan(
		200
	);
});

test('the blocker pauses the map at the monthly cap and per person per day @desktop', async ({
	page
}) => {
	await signUp(page, 'Kim');
	const prisma = db();
	const month = new Date().toISOString().slice(0, 7);
	const key = { period_kind: { period: month, kind: 'MAP_LOAD' as const } };
	const before = (await prisma.mapUsage.findUnique({ where: key }))?.count ?? null;
	try {
		// Dev cap is 2,000 map opens a month.
		await prisma.mapUsage.upsert({
			where: key,
			create: { period: month, kind: 'MAP_LOAD', count: 2000 },
			update: { count: 2000 }
		});
		const res = await page.request.post('/api/maps/ticket');
		expect(res.status()).toBe(429);
		expect((await res.json()).message).toMatch(/paused until the 1st/);

		await page.goto('/log/places/new');
		await page.getByRole('button', { name: 'Pick on map' }).click();
		await expect(
			page.getByRole('status').filter({ hasText: 'paused until the 1st' })
		).toBeVisible();
		// Logging a place still works with the map paused.
		await page.getByLabel('Name', { exact: true }).fill('Still works');
		await page.getByRole('button', { name: 'Save place' }).click();
		await expect(page.getByRole('heading', { name: 'Still works' })).toBeVisible();
	} finally {
		if (before === null) await prisma.mapUsage.delete({ where: key }).catch(() => {});
		else await prisma.mapUsage.update({ where: key, data: { count: before } });
	}

	// Per-person daily cap (200).
	const user = await prisma.user.findFirstOrThrow({
		where: { givenName: 'Kim', email: { endsWith: '@lead.test' } },
		orderBy: { createdAt: 'desc' }
	});
	const dayKey = {
		period_kind: {
			period: `${new Date().toISOString().slice(0, 10)}:${user.id}`,
			kind: 'MAP_LOAD' as const
		}
	};
	await prisma.mapUsage.upsert({
		where: dayKey,
		create: { period: dayKey.period_kind.period, kind: 'MAP_LOAD', count: 200 },
		update: { count: 200 }
	});
	const res = await page.request.post('/api/maps/ticket');
	expect(res.status()).toBe(429);
	expect((await res.json()).message).toMatch(/paused for today/);
	await prisma.mapUsage.delete({ where: dayKey });
	await prisma.$disconnect();

	await page.goto('/household');
	await expect(page.getByText(/Map use this month:/)).toBeVisible();
});

test('places export as CSV @desktop', async ({ page }) => {
	await signUp(page, 'Pat');
	await page.goto('/log/places/new');
	await page.getByLabel('Name', { exact: true }).fill('Ham Common');
	await page.getByRole('button', { name: 'Save place' }).click();
	await page.waitForURL(/\/log\/places\/(?!new$)[a-z0-9]+$/);
	const csv = await (await page.request.get('/api/export/places.csv')).text();
	expect(csv.split('\r\n')[0]).toBe(
		'"Name","Status","Recommended by","Tags","Notes","Latitude","Longitude","Walks"'
	);
	expect(csv).toContain('"Ham Common","Wishlist"');
});
