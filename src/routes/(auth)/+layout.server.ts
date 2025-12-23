/**
 * Auth Layout Server Load
 * Redirects authenticated users away from auth pages
 * (They shouldn't see login/signup if already logged in)
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// If user is already authenticated, redirect to app
	if (locals.session) {
		// Check if there's a redirect destination, otherwise go to /write
		const redirectTo = url.searchParams.get('redirectTo') || '/write';
		redirect(303, redirectTo);
	}

	return {};
};
