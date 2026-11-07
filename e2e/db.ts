import { config } from 'dotenv';
import { PrismaClient } from '../src/lib/server/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

config({ path: '.env.local', quiet: true });

export const TEST_DOMAIN = 'lead.test';
export const testEmail = (tag: string) =>
	`e2e+${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@${TEST_DOMAIN}`;

/** Dev database only (the npm script guards this). */
export const db = () =>
	new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

/** Inserts a dose that was due `minutesAgo` minutes ago for the dog's care item with this title. */
export async function insertLateDose(petId: string, title: string, minutesAgo = 72) {
	const prisma = db();
	const item = await prisma.careItem.findFirstOrThrow({ where: { petId, title } });
	const occ = await prisma.occurrence.create({
		data: { careItemId: item.id, dueAt: new Date(Date.now() - minutesAgo * 60000) }
	});
	await prisma.$disconnect();
	return occ.id;
}
