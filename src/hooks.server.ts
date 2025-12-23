// ===========================================
// THE UNSAID - Server Hooks
// ===========================================
// Handles auth on every request, manages Supabase session

import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	event.locals.supabase = createSupabaseServerClient(event);

	// Get session (refreshes token if needed)
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();
	event.locals.session = session;

	// Resolve the request with filtered headers
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	return response;
};
