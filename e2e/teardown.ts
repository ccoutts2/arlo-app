import { db, TEST_DOMAIN } from './db';

// Removes the users, households and throttle rows created by the tests (dev database only).
export default async function teardown() {
	const prisma = db();
	const users = await prisma.user.findMany({
		where: { email: { endsWith: `@${TEST_DOMAIN}` } },
		select: { id: true, memberships: { select: { householdId: true } } }
	});
	const householdIds = users.flatMap((u) => u.memberships.map((m) => m.householdId));
	await prisma.household.deleteMany({ where: { id: { in: householdIds } } });
	await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
	await prisma.loginThrottle.deleteMany({ where: { email: { endsWith: `@${TEST_DOMAIN}` } } });
	await prisma.$disconnect();
	console.log(`teardown: removed ${users.length} test users`);
}
