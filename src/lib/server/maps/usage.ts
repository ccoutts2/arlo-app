import { env } from '$env/dynamic/private';
import prisma from '../prisma';

// Mapbox free tier: 50,000 map loads and 100,000 searches a month. Lead stops at 80%, with a lower
// cap outside production so testing can't use up the real allowance, plus a per-person daily cap
// that catches a runaway bug long before the monthly one.
export type MapKind = 'MAP_LOAD' | 'GEOCODE';
const isProd = () => env.VERCEL_ENV === 'production';
export const monthlyCap = (kind: MapKind) =>
	kind === 'MAP_LOAD' ? (isProd() ? 40_000 : 2_000) : isProd() ? 80_000 : 4_000;
export const dailyCap = (kind: MapKind) => (kind === 'MAP_LOAD' ? 200 : 300);

const month = (d = new Date()) => d.toISOString().slice(0, 7); // UTC month, matching Mapbox billing
const day = (d = new Date()) => d.toISOString().slice(0, 10);

export async function usage(kind: MapKind) {
	const row = await prisma.mapUsage.findUnique({
		where: { period_kind: { period: month(), kind } }
	});
	return { used: row?.count ?? 0, cap: monthlyCap(kind) };
}

/** Counts one use if it's within the caps. Returns why not, otherwise ok. */
export async function claim(
	kind: MapKind,
	userId: string
): Promise<{ ok: true } | { ok: false; reason: 'month' | 'day' }> {
	const monthKey = { period_kind: { period: month(), kind } };
	const dayKey = { period_kind: { period: `${day()}:${userId}`, kind } };
	const [m, d] = await Promise.all([
		prisma.mapUsage.findUnique({ where: monthKey }),
		prisma.mapUsage.findUnique({ where: dayKey })
	]);
	if ((m?.count ?? 0) >= monthlyCap(kind)) return { ok: false, reason: 'month' };
	if ((d?.count ?? 0) >= dailyCap(kind)) return { ok: false, reason: 'day' };
	await prisma.$transaction([
		prisma.mapUsage.upsert({
			where: monthKey,
			create: { period: month(), kind, count: 1 },
			update: { count: { increment: 1 } }
		}),
		prisma.mapUsage.upsert({
			where: dayKey,
			create: { period: `${day()}:${userId}`, kind, count: 1 },
			update: { count: { increment: 1 } }
		})
	]);
	return { ok: true };
}

export const pausedMessage = (reason: 'month' | 'day') =>
	reason === 'month'
		? 'The map is paused until the 1st to stay within the free allowance. Everything else still works.'
		: 'The map is paused for today on your account. It’ll be back tomorrow.';
