import { PrismaClient } from '$lib/server/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from '$env/dynamic/private';

// One client per server instance. The Neon adapter suits Vercel's serverless functions.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({ adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
