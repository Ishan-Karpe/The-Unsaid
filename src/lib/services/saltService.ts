// ===========================================
// THE UNSAID - Salt Service
// ===========================================
// Handles retrieval and creation of user salts from Supabase
// Salt is used for PBKDF2 key derivation

import { supabase } from './supabase';
import { generateSalt, bufferToBase64, base64ToBuffer } from '$lib/crypto';

export interface SaltResult {
	salt: Uint8Array | null;
	isNewUser: boolean;
	error: string | null;
}

export const saltService = {
	/**
	 * Get or create salt for a user
	 * - Returns existing salt if user has one
	 * - Creates and stores new salt if first-time user
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
	 * Get salt for a user (does not create if missing)
	 * Used when we need to verify an existing salt exists
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
