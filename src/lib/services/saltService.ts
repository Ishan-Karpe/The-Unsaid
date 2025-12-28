// ===========================================
// THE UNSAID - Salt Service
// ===========================================
// Handles retrieval and creation of user salts from Supabase
// Salt is used for PBKDF2 key derivation
//
// SECURITY NOTES:
// - Salt is NOT secret - it's safe to store in the database
// - Salt is unique per user - prevents rainbow table attacks
// - Salt is 16 bytes (128 bits) generated via crypto.getRandomValues()
// - Salt is created on first login and never changes
// - If salt changes, user loses access to all encrypted data!
//
// DATABASE:
// Salts are stored in the `user_salts` table with RLS policies ensuring:
// - Users can only read their own salt
// - Users can only create a salt once (no updates/deletes)
//
// @module saltService
// @see {@link keyDerivationService} for key derivation flow

import { supabase } from './supabase';
import { generateSalt, bufferToBase64, base64ToBuffer } from '$lib/crypto';

/**
 * Result type for salt retrieval/creation operations.
 *
 * @interface SaltResult
 * @property {Uint8Array|null} salt - The 16-byte salt buffer, or null if operation failed
 * @property {boolean} isNewUser - True if a new salt was created (first-time user)
 * @property {string|null} error - Error message if operation failed, null otherwise
 *
 * @example
 * // Successful result for existing user
 * { salt: Uint8Array(16), isNewUser: false, error: null }
 *
 * @example
 * // Successful result for new user (salt was created)
 * { salt: Uint8Array(16), isNewUser: true, error: null }
 *
 * @example
 * // Failed operation
 * { salt: null, isNewUser: false, error: "Database error" }
 */
export interface SaltResult {
	salt: Uint8Array | null;
	isNewUser: boolean;
	error: string | null;
}

/**
 * Service for managing per-user encryption salts.
 *
 * Each user has a unique, randomly generated salt that is used for
 * PBKDF2 key derivation. The salt is stored in the database and
 * retrieved on login.
 *
 * WHY SALT?
 * - Prevents rainbow table attacks (precomputed password hashes)
 * - Ensures same password creates different keys for different users
 * - Part of the zero-knowledge architecture
 *
 * @example
 * // Get salt for key derivation (creates if needed)
 * const { salt, isNewUser, error } = await saltService.getOrCreateSalt(userId);
 *
 * if (salt) {
 *   const key = await deriveKey(password, salt);
 * }
 *
 * @example
 * // Just check if salt exists (without creating)
 * const { salt, error } = await saltService.getSalt(userId);
 *
 * if (!salt) {
 *   console.log("User has never logged in before");
 * }
 */
export const saltService = {
	/**
	 * Get or create salt for a user.
	 *
	 * For existing users, retrieves their stored salt.
	 * For new users, generates a cryptographically secure salt and stores it.
	 *
	 * This is the primary method used during login - it handles both
	 * first-time and returning users automatically.
	 *
	 * @param {string} userId - The user's unique identifier (from Supabase Auth)
	 *
	 * @returns {Promise<SaltResult>} The salt and creation status
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // In the key derivation flow
	 * const { salt, isNewUser, error } = await saltService.getOrCreateSalt(userId);
	 *
	 * if (error || !salt) {
	 *   return { success: false, error: error || 'Failed to get salt' };
	 * }
	 *
	 * // For new users, you might want to show a welcome message
	 * if (isNewUser) {
	 *   console.log('Welcome! Your encryption has been initialized.');
	 * }
	 *
	 * const key = await deriveKey(password, salt);
	 *
	 * @security
	 * - Salt is generated using crypto.getRandomValues() (CSPRNG)
	 * - Salt is 128 bits (16 bytes) - more than sufficient for PBKDF2
	 * - Salt is stored as base64 in the database
	 * - RLS policies prevent other users from accessing salts
	 */
	async getOrCreateSalt(userId: string): Promise<SaltResult> {
		try {
			// Try to fetch existing salt
			const { data, error } = await supabase
				.from('user_salts')
				.select('salt')
				.eq('user_id', userId)
				.single();

			if (error && error.code !== 'PGRST116') {
				// PGRST116 = no rows returned (new user), any other error is unexpected
				return { salt: null, isNewUser: false, error: error.message };
			}

			if (data?.salt) {
				// Existing user - return their salt
				return {
					salt: base64ToBuffer(data.salt),
					isNewUser: false,
					error: null
				};
			}

			// New user - generate and store salt
			const newSalt = generateSalt();
			const { error: insertError } = await supabase.from('user_salts').insert({
				user_id: userId,
				salt: bufferToBase64(newSalt)
			});

			if (insertError) {
				return { salt: null, isNewUser: true, error: insertError.message };
			}

			return { salt: newSalt, isNewUser: true, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to get or create salt';
			return { salt: null, isNewUser: false, error: message };
		}
	},

	/**
	 * Get salt for a user (does not create if missing).
	 *
	 * Use this when you need to verify a salt exists without
	 * creating one. This is useful for:
	 * - Checking if a user has ever logged in
	 * - Validating session restoration
	 * - Admin/debugging purposes
	 *
	 * @param {string} userId - The user's unique identifier
	 *
	 * @returns {Promise<{salt: Uint8Array | null; error: string | null}>} The salt or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Check if user has encryption set up
	 * const { salt, error } = await saltService.getSalt(userId);
	 *
	 * if (!salt && !error) {
	 *   // User exists but has never completed encryption setup
	 *   console.log('User needs to set up encryption');
	 * }
	 *
	 * @example
	 * // Validate before session restoration
	 * async function canRestoreSession(userId: string): Promise<boolean> {
	 *   const { salt } = await saltService.getSalt(userId);
	 *   return salt !== null;
	 * }
	 */
	async getSalt(userId: string): Promise<{ salt: Uint8Array | null; error: string | null }> {
		try {
			const { data, error } = await supabase
				.from('user_salts')
				.select('salt')
				.eq('user_id', userId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return { salt: null, error: 'No salt found for user' };
				}
				return { salt: null, error: error.message };
			}

			return {
				salt: base64ToBuffer(data.salt),
				error: null
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to get salt';
			return { salt: null, error: message };
		}
	}
};
