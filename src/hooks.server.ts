// ===========================================
// THE UNSAID - Server Hooks
// ===========================================
// Handles auth on every request

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// TODO: Initialize Supabase server client
	// event.locals.supabase = createServerClient(...)

	// TODO: Get session and attach to locals
	// const session = await event.locals.supabase.auth.getSession();
	// event.locals.session = session.data.session;

	const response = await resolve(event);

	return response;
};
