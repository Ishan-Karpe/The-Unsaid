// ===========================================
// THE UNSAID - Account Deletion Endpoint
// ===========================================
// Server-side endpoint for deleting user accounts.
// Requires the Supabase service role key for admin operations.

import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SECRET_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

/**
 * DELETE /api/account/delete
 *
 * Permanently deletes the current user's account and all associated data.
 * This includes:
 * - All drafts (active and soft-deleted)
 * - User preferences
 * - User salt
 * - The auth user account
 *
 * @requires Authentication - User must be logged in
 */
export const DELETE: RequestHandler = async (event) => {
	// Get the user's session from cookies
	const supabase = createSupabaseServerClient(event);

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return json({ error: 'Unauthorized - please log in' }, { status: 401 });
	}

	const userId = user.id;

	// Create admin client with secret key for admin operations
	if (!PRIVATE_SUPABASE_SECRET_KEY) {
		console.error('PRIVATE_SUPABASE_SECRET_KEY not configured');
		return json({ error: 'Server configuration error' }, { status: 500 });
	}

	const adminClient = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SECRET_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	try {
		// 1. Delete all drafts (including soft-deleted ones)
		const { error: draftsError } = await adminClient.from('drafts').delete().eq('user_id', userId);

		if (draftsError) {
			console.error('Error deleting drafts:', draftsError);
			// Continue with other deletions even if this fails
		}

		// 2. Delete user preferences
		const { error: prefsError } = await adminClient
			.from('user_preferences')
			.delete()
			.eq('user_id', userId);

		if (prefsError) {
			console.error('Error deleting preferences:', prefsError);
			// Continue with other deletions
		}

		// 3. Delete user salt
		const { error: saltError } = await adminClient
			.from('user_salts')
			.delete()
			.eq('user_id', userId);

		if (saltError) {
			console.error('Error deleting salt:', saltError);
			// Continue with account deletion
		}

		// 4. Delete the auth user account
		const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

		if (deleteUserError) {
			console.error('Error deleting user account:', deleteUserError);
			return json(
				{ error: 'Failed to delete account: ' + deleteUserError.message },
				{ status: 500 }
			);
		}

		return json({ success: true, message: 'Account deleted successfully' });
	} catch (err) {
		console.error('Account deletion error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to delete account' },
			{ status: 500 }
		);
	}
};
