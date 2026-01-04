// ===========================================
// THE UNSAID - Server Hooks
// ===========================================
// Handles auth on every request, manages Supabase session

import type { Handle } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { createSupabaseServerClient } from '$lib/server/supabase';

function parseE2EUser(raw: string | undefined): User | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(decodeURIComponent(raw)) as {
			id?: string;
			email?: string;
			created_at?: string;
		};
		if (!parsed.id) return null;
		return {
			id: parsed.id,
			email: parsed.email,
			created_at: parsed.created_at
		} as User;
	} catch {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	event.locals.supabase = createSupabaseServerClient(event);

	if (env.PUBLIC_E2E === 'true') {
		event.locals.user = parseE2EUser(event.cookies.get('e2e_user'));
	} else {
		// Use getUser() for secure server-side verification
		// This contacts the Supabase Auth server to verify the token
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		event.locals.user = user;
	}

	// Resolve the request with filtered headers
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	return response;
};
