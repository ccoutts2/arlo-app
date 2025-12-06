import { PrismaClient } from '../../../prisma/src/generated/prisma/client';
import { DATABASE_URL } from '$env/static/private';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
	connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
	adapter,
});

export default prisma;
