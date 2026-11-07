import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Local dev uses .env.local (pulled from Vercel's Development environment = the dev database).
config({ path: '.env.local' });
config();

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: {
		// Migrations need a direct (unpooled) connection.
		url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? ''
	}
});
