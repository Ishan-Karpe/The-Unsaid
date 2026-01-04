import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Vercel adapter for deployment
		// See https://svelte.dev/docs/kit/adapter-vercel for configuration options
		adapter: adapter({
			// Explicitly set Node.js runtime version for Vercel
			// This ensures consistent behavior between local builds and deployment
			runtime: 'nodejs22.x',
			// Split routes into separate functions for better cold start times
			split: false
		})
	}
};

export default config;
