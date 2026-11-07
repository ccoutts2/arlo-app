// Refuses to continue if the database URL points at production.
// Run before anything that writes or deletes test data (migrate dev, e2e tests, seeds).
import fs from 'node:fs';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
	console.error('guard-dev-db: no DATABASE_URL set. Run `vercel env pull .env.local`.');
	process.exit(1);
}
const host = new URL(url).hostname.split('.')[0];
const prodHost = fs.existsSync('.prod-host') ? fs.readFileSync('.prod-host', 'utf8').trim() : null;
if (!prodHost) {
	console.error('guard-dev-db: .prod-host missing, so production cannot be ruled out. Aborting.');
	process.exit(1);
}
if (host === prodHost) {
	console.error('guard-dev-db: DATABASE_URL points at PRODUCTION. Aborting.');
	process.exit(1);
}
console.log(`guard-dev-db: ok (${host} is not production)`);
