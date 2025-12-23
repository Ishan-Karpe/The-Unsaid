/**
 * Auth Guard for protected (app) routes
 * Redirects unauthenticated users to login with return URL
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.session) {
		// Redirect to login with the intended destination
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Return user info for protected routes
	return {
		user: {
			id: locals.session.user.id,
			email: locals.session.user.email!,
			createdAt: locals.session.user.created_at
		}
	};
};
