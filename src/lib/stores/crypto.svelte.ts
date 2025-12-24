// ===========================================
// THE UNSAID - Crypto Store (Svelte 5 Runes)
// ===========================================
// Provides reactive state for encryption status in the UI
// Tracks whether the encryption key is available and ready

import { keyDerivationService } from '$lib/services';

// Reactive state using Svelte 5 runes (module-level state)
let encryptionReady = $state<boolean>(false);
let deriving = $state<boolean>(false);
let error = $state<string | null>(null);

export const cryptoStore = {
	get isReady() {
		return encryptionReady;
	},
	get isDeriving() {
		return deriving;
	},
	get error() {
		return error;
	},

	/**
	 * Derive and store encryption key from password
	 * Call this after successful authentication
	 */
	async deriveKey(userId: string, password: string): Promise<boolean> {
		deriving = true;
		error = null;

		const result = await keyDerivationService.deriveAndStoreKey(userId, password);

		if (!result.success) {
			error = result.error || 'Failed to derive encryption key';
			encryptionReady = false;
			deriving = false;
			return false;
		}

		encryptionReady = true;
		deriving = false;
		return true;
	},

	/**
	 * Check if the encryption key is currently available
	 * Syncs internal state with the key derivation service
	 */
	checkReady(): boolean {
		encryptionReady = keyDerivationService.isKeyReady();
		return encryptionReady;
	},

	/**
	 * Clear the encryption key and reset state
	 * Call this on logout
	 */
	clear() {
		keyDerivationService.clearEncryptionKey();
		encryptionReady = false;
		deriving = false;
		error = null;
	},

	/**
	 * Set an error message
	 */
	setError(errorMessage: string | null) {
		error = errorMessage;
	}
};
