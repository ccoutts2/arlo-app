import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// London, next to the Neon databases (eu-west-2).
		adapter: adapter({ regions: ['lhr1'] }),
		serviceWorker: { register: true }
	}
};

export default config;
