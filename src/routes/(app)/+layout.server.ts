/**
 * Auth Guard for protected (app) routes
 * Redirects unauthenticated users to login with return URL
 * Redirects new users to onboarding if not completed/skipped
 */
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.user) {
		// Redirect to login with the intended destination
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	if (env.PUBLIC_E2E === 'true') {
		return {
			user: {
				id: locals.user.id,
				email: locals.user.email!,
				createdAt: locals.user.created_at,
				user_metadata: locals.user.user_metadata
			}
		};
	}

	// Check onboarding status (skip if already on /onboarding route)
	const isOnboardingRoute = url.pathname === '/onboarding';

	if (!isOnboardingRoute && locals.supabase) {
		// Query preferences to check onboarding status
		const { data: preferences } = await locals.supabase
			.from('preferences')
			.select('onboarding_completed, onboarding_skipped_at')
			.eq('user_id', locals.user.id)
			.single();

		// If no preferences exist or onboarding not completed and not skipped, redirect
		const needsOnboarding =
			!preferences || (!preferences.onboarding_completed && !preferences.onboarding_skipped_at);

		if (needsOnboarding) {
			redirect(303, '/onboarding');
		}
	}

	// Return user info for protected routes (including metadata for avatar/name)
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email!,
			createdAt: locals.user.created_at,
			user_metadata: locals.user.user_metadata
		}
	};
};
