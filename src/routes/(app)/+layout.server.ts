/**
 * Auth Guard for protected (app) routes
 * Redirects unauthenticated users to login with return URL
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.user) {
		// Redirect to login with the intended destination
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Return user info for protected routes
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email!,
			createdAt: locals.user.created_at
		}
	};
};
