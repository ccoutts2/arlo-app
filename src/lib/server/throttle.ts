import prisma from './prisma';

// After MAX_FAILURES wrong passwords inside WINDOW, the email is locked for LOCK.
export const MAX_FAILURES = 5;
const WINDOW = 15 * 60 * 1000;
const LOCK = 15 * 60 * 1000;

const key = (email: string) => email.trim().toLowerCase();

/** Minutes until the email can try again, or 0 if it isn't locked. */
export async function lockedForMinutes(email: string): Promise<number> {
	const row = await prisma.loginThrottle.findUnique({ where: { email: key(email) } });
	if (!row?.lockedUntil) return 0;
	const ms = row.lockedUntil.getTime() - Date.now();
	return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

export async function recordFailure(email: string): Promise<void> {
	const id = key(email);
	const now = new Date();
	const row = await prisma.loginThrottle.findUnique({ where: { email: id } });
	const fresh = !row || now.getTime() - row.windowStart.getTime() > WINDOW;
	const failures = fresh ? 1 : row.failures + 1;
	await prisma.loginThrottle.upsert({
		where: { email: id },
		create: { email: id, failures: 1, windowStart: now },
		update: {
			failures,
			windowStart: fresh ? now : row.windowStart,
			lockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK) : null
		}
	});
}

export async function clearFailures(email: string): Promise<void> {
	await prisma.loginThrottle.deleteMany({ where: { email: key(email) } });
}
