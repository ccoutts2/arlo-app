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
