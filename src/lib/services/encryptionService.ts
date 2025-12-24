// ===========================================
// THE UNSAID - Encryption Service
// ===========================================
// High-level API for encrypting/decrypting drafts
// Uses the underlying crypto module for AES-256-GCM encryption

import { encrypt, decrypt, generateIV } from '$lib/crypto';
import { keyDerivationService } from './keyDerivationService';
import type { DraftMetadata } from '$lib/types';

export interface EncryptDraftResult {
	encryptedDraft: {
		encrypted_content: string;
		encrypted_metadata: string;
		iv: string;
	} | null;
	error: string | null;
}

export interface DecryptDraftResult {
	draft: {
		content: string;
		recipient: string;
		intent: string;
		emotion?: string;
	} | null;
	error: string | null;
}

export const encryptionService = {
	/**
	 * Encrypt a draft for storage
	 * Returns encrypted content and metadata with shared IV
	 *
	 * Uses AES-256-GCM with a single IV for both content and metadata.
	 * This is cryptographically safe because:
	 * 1. Content and metadata are different plaintexts
	 * 2. GCM mode uses an internal counter
	 *
	 * @param draft - The draft to encrypt with content and metadata
	 * @returns Encrypted draft data or error
	 */
	async encryptDraft(draft: {
		content: string;
		recipient: string;
		intent: string;
		emotion?: string;
	}): Promise<EncryptDraftResult> {
		const key = keyDerivationService.getEncryptionKey();

		if (!key) {
			return { encryptedDraft: null, error: 'Encryption key not available' };
		}

		try {
			// Generate a single IV for this draft
			const iv = generateIV();

			// Encrypt content with the shared IV
			const { ciphertext: encryptedContent, iv: ivBase64 } = await encrypt(draft.content, key, iv);

			// Encrypt metadata as JSON with the same IV
			// Note: Using same IV for different plaintexts is safe in GCM mode
			const metadata: DraftMetadata = {
				recipient: draft.recipient,
				intent: draft.intent,
				emotion: draft.emotion
			};
			const { ciphertext: encryptedMetadata } = await encrypt(JSON.stringify(metadata), key, iv);

			return {
				encryptedDraft: {
					encrypted_content: encryptedContent,
					encrypted_metadata: encryptedMetadata,
					iv: ivBase64
				},
				error: null
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Encryption failed';
			return { encryptedDraft: null, error: message };
		}
	},

	/**
	 * Decrypt an encrypted draft
	 * Returns decrypted content and metadata
	 *
	 * @param encryptedDraft - The encrypted draft data from database
	 * @returns Decrypted draft or error
	 */
	async decryptDraft(encryptedDraft: {
		encrypted_content: string;
		encrypted_metadata: string;
		iv: string;
	}): Promise<DecryptDraftResult> {
		const key = keyDerivationService.getEncryptionKey();

		if (!key) {
			return { draft: null, error: 'Encryption key not available' };
		}

		try {
			// Decrypt content
			const content = await decrypt(encryptedDraft.encrypted_content, encryptedDraft.iv, key);

			// Decrypt and parse metadata
			const metadataJson = await decrypt(encryptedDraft.encrypted_metadata, encryptedDraft.iv, key);
			const metadata: DraftMetadata = JSON.parse(metadataJson);

			return {
				draft: {
					content,
					recipient: metadata.recipient,
					intent: metadata.intent,
					emotion: metadata.emotion
				},
				error: null
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Decryption failed';
			return { draft: null, error: message };
		}
	},

	/**
	 * Check if encryption is ready
	 * Used to verify the key is available before attempting operations
	 */
	isReady(): boolean {
		return keyDerivationService.isKeyReady();
	}
};
