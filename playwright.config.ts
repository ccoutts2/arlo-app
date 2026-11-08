import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against a production build using the DEV database (.env.local).
// `npm run test:e2e` runs scripts/guard-dev-db.mjs first and refuses to run against production.
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	// Every request round-trips to Neon in London, so allow for the occasional slow response.
	timeout: 45_000,
	expect: { timeout: 10_000 },
	reporter: [['list']],
	globalTeardown: './e2e/teardown.ts',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},
	projects: [
		// Tag a test @desktop (server-side, run once) or @phone (phone-only behaviour).
		{
			name: 'iphone',
			grepInvert: /@desktop/,
			use: { ...devices['iPhone 13'], browserName: 'chromium' }
		},
		{ name: 'desktop', grepInvert: /@phone/, use: { ...devices['Desktop Chrome'] } }
	],
	webServer: {
		command: 'npm run build && npx vite preview --port 4173',
		port: 4173,
		timeout: 240_000,
		// Trust the fake push service's throwaway certificate (and nothing else extra).
		env: { NODE_EXTRA_CA_CERTS: 'e2e/.cert/cert.pem' },
		reuseExistingServer: true
	}
});
