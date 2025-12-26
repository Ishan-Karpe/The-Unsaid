// ===========================================
// THE UNSAID - Server Hooks
// ===========================================
// Handles auth on every request, manages Supabase session

import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	event.locals.supabase = createSupabaseServerClient(event);

	// Use getUser() for secure server-side verification
	// This contacts the Supabase Auth server to verify the token
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	// Resolve the request with filtered headers
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	return response;
};
