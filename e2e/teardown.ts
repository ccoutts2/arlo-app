import { del } from '@vercel/blob';
import { db, TEST_DOMAIN } from './db';

// Removes the users, households and throttle rows created by the tests (dev database only).
export default async function teardown() {
	const prisma = db();
	const users = await prisma.user.findMany({
		where: { email: { endsWith: `@${TEST_DOMAIN}` } },
		select: { id: true, memberships: { select: { householdId: true } } }
	});
	const householdIds = users.flatMap((u) => u.memberships.map((m) => m.householdId));
	// Photos live in the dev Blob store (the npm script guards against the production store).
	const files = await prisma.file.findMany({
		where: { householdId: { in: householdIds } },
		select: { pathname: true }
	});
	if (files.length)
		await del(
			files.map((f) => f.pathname),
			{ token: process.env.BLOB_READ_WRITE_TOKEN }
		);
	await prisma.household.deleteMany({ where: { id: { in: householdIds } } });
	await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
	// Per-person daily map counters for test users (the monthly counter is left alone).
	for (const u of users)
		await prisma.mapUsage.deleteMany({ where: { period: { endsWith: `:${u.id}` } } });
	await prisma.loginThrottle.deleteMany({ where: { email: { endsWith: `@${TEST_DOMAIN}` } } });
	await prisma.$disconnect();
	console.log(`teardown: removed ${users.length} test users and ${files.length} files`);
}
