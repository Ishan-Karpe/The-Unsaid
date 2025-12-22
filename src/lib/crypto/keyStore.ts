// ===========================================
// THE UNSAID - Key Store (In-Memory Only)
// ===========================================
// CRITICAL: Keys are NEVER persisted to storage
// They exist only in memory and are cleared on logout

let encryptionKey: CryptoKey | null = null;
let userSalt: Uint8Array | null = null;

/**
 * Store the encryption key in memory
 * Called after successful login + key derivation
 */
export function setKey(key: CryptoKey, salt: Uint8Array): void {
	encryptionKey = key;
	userSalt = salt;
}

/**
 * Get the current encryption key
 * Returns null if not logged in or key not derived
 */
export function getKey(): CryptoKey | null {
	return encryptionKey;
}

/**
 * Get the user's salt
 * Needed for key derivation verification
 */
export function getSalt(): Uint8Array | null {
	return userSalt;
}

/**
 * Check if encryption key is available
 */
export function hasKey(): boolean {
	return encryptionKey !== null;
}

/**
 * Clear the encryption key from memory
 * MUST be called on logout
 */
export function clearKey(): void {
	encryptionKey = null;
	userSalt = null;
}
