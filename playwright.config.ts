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
		{ name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }
	],
	webServer: {
		command: 'npm run build && npx vite preview --port 4173',
		port: 4173,
		timeout: 240_000,
		reuseExistingServer: true
	}
});
