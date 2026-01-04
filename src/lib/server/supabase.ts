// ===========================================
// THE UNSAID - Supabase Server Client
// Server-side Supabase client factory for SSR authentication
// ===========================================

import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a Supabase client configured for server-side use.
 * Handles cookie management for session persistence across requests.
 *
 * @param event - The SvelteKit request event containing cookies
 * @returns A Supabase client configured for server-side operations
 */
export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}
