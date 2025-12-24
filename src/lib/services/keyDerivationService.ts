// ===========================================
// THE UNSAID - Key Derivation Service
// ===========================================
// Orchestrates the full key derivation flow:
// 1. Get or create salt for user
// 2. Derive AES-256 key from password + salt via PBKDF2
// 3. Store key in memory (never persisted)

import { deriveKey, setKey, clearKey, hasKey, getKey } from '$lib/crypto';
import { saltService } from './saltService';

export interface KeyDerivationResult {
	success: boolean;
	isNewUser: boolean;
	error: string | null;
}

export const keyDerivationService = {
	/**
	 * Derive and store encryption key for user
	 * Called after successful authentication
	 *
	 * @param userId - The user's unique identifier
	 * @param password - The user's password (used for key derivation, not stored)
	 * @returns KeyDerivationResult with success status and any errors
	 */
	async deriveAndStoreKey(userId: string, password: string): Promise<KeyDerivationResult> {
		try {
			// Get or create salt for this user
			const { salt, isNewUser, error } = await saltService.getOrCreateSalt(userId);

			if (error || !salt) {
				return {
					success: false,
					isNewUser: false,
					error: error || 'Failed to get salt'
				};
			}

			// Derive the encryption key from password + salt
			// Uses PBKDF2 with 100,000 iterations (see cipher.ts)
			const key = await deriveKey(password, salt);

			// Store key in memory (never persisted to disk or server)
			setKey(key, salt);

			return { success: true, isNewUser, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Key derivation failed';
			return { success: false, isNewUser: false, error: message };
		}
	},

	/**
	 * Clear encryption key from memory
	 * MUST be called on logout to prevent key leakage
	 */
	clearEncryptionKey(): void {
		clearKey();
	},

	/**
	 * Check if encryption key is available
	 * Used to verify crypto readiness before operations
	 */
	isKeyReady(): boolean {
		return hasKey();
	},

	/**
	 * Get the current encryption key
	 * Returns null if not derived yet
	 *
	 * @returns The CryptoKey or null if not available
	 */
	getEncryptionKey(): CryptoKey | null {
		return getKey();
	}
};
