// ===========================================
// THE UNSAID - Key Derivation Service
// ===========================================
// Orchestrates the full key derivation flow:
// 1. Get or create salt for user
// 2. Derive AES-256 key from password + salt via PBKDF2
// 3. Store key in memory (never persisted)
//
// SECURITY ARCHITECTURE:
// - Uses PBKDF2-SHA-256 with 100,000 iterations
// - Salt is 16 bytes (128 bits) from crypto.getRandomValues()
// - Derived key is 256 bits (AES-256)
// - Key exists ONLY in memory - never written to disk or sent to server
// - Key is cleared on logout or session expiration
//
// KEY LIFECYCLE:
// 1. User logs in with email/password
// 2. deriveAndStoreKey() fetches salt and derives key
// 3. Key remains in memory for encrypt/decrypt operations
// 4. On logout, clearEncryptionKey() wipes the key
// 5. If session refreshes but key is lost (page reload), user re-enters password
//
// @module keyDerivationService
// @see {@link saltService} for salt management
// @see {@link $lib/crypto/cipher} for PBKDF2 implementation

import { deriveKey, setKey, clearKey, hasKey, getKey } from '$lib/crypto';
import { saltService } from './saltService';

/**
 * Result type for key derivation operations.
 *
 * @interface KeyDerivationResult
 * @property {boolean} success - Whether key derivation succeeded
 * @property {boolean} isNewUser - True if this is a first-time user (new salt created)
 * @property {string|null} error - Error message if derivation failed, null otherwise
 *
 * @example
 * // Successful derivation for existing user
 * { success: true, isNewUser: false, error: null }
 *
 * @example
 * // Successful derivation for new user (salt was created)
 * { success: true, isNewUser: true, error: null }
 *
 * @example
 * // Failed derivation
 * { success: false, isNewUser: false, error: "Failed to get salt" }
 */
export interface KeyDerivationResult {
	success: boolean;
	isNewUser: boolean;
	error: string | null;
}

/**
 * Service for deriving and managing encryption keys.
 *
 * This is the core security service that bridges authentication and encryption.
 * It ensures that:
 * - The encryption key is derived from the user's password
 * - The key never leaves the browser
 * - The server cannot decrypt user content (zero-knowledge)
 *
 * @example
 * // After successful login, derive the encryption key
 * const { success, error } = await keyDerivationService.deriveAndStoreKey(
 *   user.id,
 *   password
 * );
 *
 * if (!success) {
 *   console.error("Key derivation failed:", error);
 *   return;
 * }
 *
 * // Key is now in memory, encryption service can use it
 * console.log(keyDerivationService.isKeyReady()); // true
 *
 * @example
 * // On logout, clear the encryption key
 * await supabase.auth.signOut();
 * keyDerivationService.clearEncryptionKey();
 *
 * // Key is now gone
 * console.log(keyDerivationService.isKeyReady()); // false
 */
export const keyDerivationService = {
	/**
	 * Derive and store the encryption key for a user.
	 *
	 * This is called after successful authentication. It:
	 * 1. Fetches the user's salt from the database (or creates one for new users)
	 * 2. Derives an AES-256 key using PBKDF2 with 100,000 iterations
	 * 3. Stores the key in memory for use by the encryption service
	 *
	 * The password is used only for derivation and is NOT stored anywhere.
	 *
	 * @param {string} userId - The user's unique identifier (from Supabase Auth)
	 * @param {string} password - The user's password (used for derivation, not stored)
	 *
	 * @returns {Promise<KeyDerivationResult>} Result with success status and any errors
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Called in the login flow after auth succeeds
	 * async function handleLogin(email: string, password: string) {
	 *   const { data, error: authError } = await supabase.auth.signInWithPassword({
	 *     email,
	 *     password
	 *   });
	 *
	 *   if (authError) return { error: authError.message };
	 *
	 *   // Derive encryption key from the same password
	 *   const { success, error } = await keyDerivationService.deriveAndStoreKey(
	 *     data.user.id,
	 *     password
	 *   );
	 *
	 *   if (!success) {
	 *     // Key derivation failed - log out and show error
	 *     await supabase.auth.signOut();
	 *     return { error: error || 'Failed to initialize encryption' };
	 *   }
	 *
	 *   return { success: true };
	 * }
	 *
	 * @security
	 * - Password is used only for PBKDF2 derivation
	 * - Password is never stored or logged
	 * - Salt is per-user and stored in database (safe - salt is not secret)
	 * - Derived key never leaves the browser
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
	 * Clear the encryption key from memory.
	 *
	 * This MUST be called on logout to prevent key leakage.
	 * After calling this, all encryption operations will fail until
	 * deriveAndStoreKey() is called again.
	 *
	 * @returns {void}
	 *
	 * @example
	 * // In auth state change handler
	 * supabase.auth.onAuthStateChange((event) => {
	 *   if (event === 'SIGNED_OUT') {
	 *     keyDerivationService.clearEncryptionKey();
	 *   }
	 * });
	 *
	 * @security
	 * - Key is overwritten in memory, not just dereferenced
	 * - Salt reference is also cleared
	 * - Calling isKeyReady() after this returns false
	 */
	clearEncryptionKey(): void {
		clearKey();
	},

	/**
	 * Check if the encryption key is available.
	 *
	 * Use this to verify crypto readiness before attempting operations.
	 * Returns false if:
	 * - User hasn't logged in yet
	 * - User logged out
	 * - Page was refreshed (key is lost but session may persist)
	 *
	 * @returns {boolean} True if key is available, false otherwise
	 *
	 * @example
	 * // Guard pattern in components
	 * function EditDraft() {
	 *   if (!keyDerivationService.isKeyReady()) {
	 *     return <PasswordPrompt />;
	 *   }
	 *
	 *   return <DraftEditor />;
	 * }
	 *
	 * @example
	 * // In layout to show password prompt
	 * if (user && !keyDerivationService.isKeyReady()) {
	 *   needsPasswordPrompt = true;
	 * }
	 */
	isKeyReady(): boolean {
		return hasKey();
	},

	/**
	 * Get the current encryption key.
	 *
	 * Returns the CryptoKey object for use with Web Crypto API.
	 * Returns null if key hasn't been derived yet.
	 *
	 * This is primarily used internally by the encryption service.
	 * Most code should use encryptionService methods instead.
	 *
	 * @returns {CryptoKey|null} The AES-256-GCM key or null if not available
	 *
	 * @example
	 * // Used internally by encryptionService
	 * const key = keyDerivationService.getEncryptionKey();
	 * if (!key) {
	 *   return { error: 'Encryption key not available' };
	 * }
	 *
	 * const { ciphertext } = await encrypt(content, key);
	 *
	 * @security
	 * - Never log or serialize this key
	 * - Never send this key to any server
	 * - Key is usable only with Web Crypto API
	 */
	getEncryptionKey(): CryptoKey | null {
		return getKey();
	}
};
