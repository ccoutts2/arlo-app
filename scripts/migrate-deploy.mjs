// Applies committed migrations during a Vercel build. Neon's free databases sleep when idle and
// can take a few seconds to wake, so a "can't reach database" error (P1001) is retried.
import { execSync } from 'node:child_process';

for (let attempt = 1; attempt <= 4; attempt++) {
	try {
		execSync('npx prisma migrate deploy', { stdio: 'inherit' });
		process.exit(0);
	} catch {
		if (attempt === 4) process.exit(1);
		const wait = attempt * 5;
		console.log(`migrate-deploy: attempt ${attempt} failed (database may be waking up), retrying in ${wait}s`);
		await new Promise((r) => setTimeout(r, wait * 1000));
	}
}
