// ===========================================
// THE UNSAID - Encryption Service
// ===========================================
// High-level API for encrypting/decrypting drafts
// Uses the underlying crypto module for AES-256-GCM encryption
//
// ARCHITECTURE:
// This service acts as the bridge between the draft service and
// the low-level crypto module. It handles:
// - Draft content encryption (text body)
// - Metadata encryption (recipient, intent, emotion)
// - Coordinating with keyDerivationService for key access
//
// SECURITY NOTES:
// - All encryption uses AES-256-GCM (authenticated encryption)
// - IVs are generated using crypto.getRandomValues() for uniqueness
// - Same IV for content and metadata is safe due to different plaintexts
// - Keys are never persisted; only stored in memory during session
//
// @module encryptionService
// @see {@link keyDerivationService} for key derivation
// @see {@link $lib/crypto/cipher} for low-level crypto operations

import { encrypt, decrypt, generateIV } from '$lib/crypto';
import { keyDerivationService } from './keyDerivationService';
import type { DraftMetadata } from '$lib/types';

/**
 * Result type for draft encryption operations.
 *
 * @interface EncryptDraftResult
 * @property {Object|null} encryptedDraft - The encrypted draft data, or null if encryption failed
 * @property {string} encryptedDraft.encrypted_content - Base64-encoded encrypted content
 * @property {string} encryptedDraft.encrypted_metadata - Base64-encoded encrypted metadata JSON
 * @property {string} encryptedDraft.iv - Base64-encoded initialization vector (96 bits)
 * @property {string|null} error - Error message if encryption failed, null otherwise
 *
 * @example
 * // Successful encryption result
 * {
 *   encryptedDraft: {
 *     encrypted_content: "base64...",
 *     encrypted_metadata: "base64...",
 *     iv: "base64..."
 *   },
 *   error: null
 * }
 *
 * @example
 * // Failed encryption result
 * {
 *   encryptedDraft: null,
 *   error: "Encryption key not available"
 * }
 */
export interface EncryptDraftResult {
	encryptedDraft: {
		encrypted_content: string;
		encrypted_metadata: string;
		iv: string;
	} | null;
	error: string | null;
}

/**
 * Result type for draft decryption operations.
 *
 * @interface DecryptDraftResult
 * @property {Object|null} draft - The decrypted draft data, or null if decryption failed
 * @property {string} draft.content - The plaintext draft content
 * @property {string} draft.recipient - Who the message is for
 * @property {string} draft.intent - The purpose/intent of the message
 * @property {string} [draft.emotion] - Optional emotional context
 * @property {string|null} error - Error message if decryption failed, null otherwise
 *
 * @example
 * // Successful decryption result
 * {
 *   draft: {
 *     content: "Dear Mom, I wanted to tell you...",
 *     recipient: "Mom",
 *     intent: "Expressing gratitude",
 *     emotion: "grateful"
 *   },
 *   error: null
 * }
 */
export interface DecryptDraftResult {
	draft: {
		content: string;
		recipient: string;
		intent: string;
		emotion?: string;
	} | null;
	error: string | null;
}

/**
 * Encryption service for zero-knowledge draft storage.
 *
 * All drafts are encrypted client-side before being sent to the server.
 * The server never sees plaintext content - this is the core privacy feature
 * of The Unsaid.
 *
 * @example
 * // Check if encryption is ready before operations
 * if (!encryptionService.isReady()) {
 *   // Prompt user to re-enter password
 *   return;
 * }
 *
 * @example
 * // Encrypt a draft for storage
 * const { encryptedDraft, error } = await encryptionService.encryptDraft({
 *   content: "Thank you for everything...",
 *   recipient: "Mom",
 *   intent: "Expressing gratitude",
 *   emotion: "grateful"
 * });
 *
 * if (error) {
 *   console.error("Encryption failed:", error);
 * } else {
 *   // Send encryptedDraft to database
 *   await supabase.from('drafts').insert(encryptedDraft);
 * }
 *
 * @example
 * // Decrypt a draft from storage
 * const { draft, error } = await encryptionService.decryptDraft({
 *   encrypted_content: "base64...",
 *   encrypted_metadata: "base64...",
 *   iv: "base64..."
 * });
 *
 * if (draft) {
 *   console.log("Decrypted content:", draft.content);
 * }
 */
export const encryptionService = {
	/**
	 * Encrypt a draft for storage in the database.
	 *
	 * This method encrypts both the content and metadata using AES-256-GCM.
	 * A single IV is used for both encryptions, which is cryptographically
	 * safe because:
	 * 1. Content and metadata are different plaintexts
	 * 2. GCM mode uses an internal counter that differentiates operations
	 *
	 * @param {Object} draft - The draft to encrypt
	 * @param {string} draft.content - The main message content
	 * @param {string} draft.recipient - Who the message is for
	 * @param {string} draft.intent - The purpose of the message
	 * @param {string} [draft.emotion] - Optional emotional context
	 *
	 * @returns {Promise<EncryptDraftResult>} The encrypted draft or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * const { encryptedDraft, error } = await encryptionService.encryptDraft({
	 *   content: "I've been meaning to tell you...",
	 *   recipient: "Dad",
	 *   intent: "Apologizing",
	 *   emotion: "regretful"
	 * });
	 *
	 * if (!error && encryptedDraft) {
	 *   // encryptedDraft.encrypted_content - Base64 ciphertext
	 *   // encryptedDraft.encrypted_metadata - Base64 encrypted JSON
	 *   // encryptedDraft.iv - Base64 IV for decryption
	 * }
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
	 * Decrypt an encrypted draft from the database.
	 *
	 * This method decrypts both the content and metadata using the stored IV
	 * and the user's encryption key from memory.
	 *
	 * @param {Object} encryptedDraft - The encrypted draft data from database
	 * @param {string} encryptedDraft.encrypted_content - Base64-encoded ciphertext
	 * @param {string} encryptedDraft.encrypted_metadata - Base64-encoded encrypted JSON
	 * @param {string} encryptedDraft.iv - Base64-encoded initialization vector
	 *
	 * @returns {Promise<DecryptDraftResult>} The decrypted draft or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * const { draft, error } = await encryptionService.decryptDraft({
	 *   encrypted_content: dbRow.encrypted_content,
	 *   encrypted_metadata: dbRow.encrypted_metadata,
	 *   iv: dbRow.iv
	 * });
	 *
	 * if (draft) {
	 *   console.log(draft.content);    // "I've been meaning to tell you..."
	 *   console.log(draft.recipient);  // "Dad"
	 *   console.log(draft.intent);     // "Apologizing"
	 * }
	 *
	 * @security
	 * - Returns error if key is not available (user needs to re-authenticate)
	 * - Decryption will fail if ciphertext was tampered with (GCM authentication)
	 * - Invalid JSON in metadata will cause decryption to fail
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
	 * Check if the encryption service is ready to perform operations.
	 *
	 * This should be called before attempting any encrypt/decrypt operations.
	 * If this returns false, the user needs to re-enter their password to
	 * derive the encryption key.
	 *
	 * @returns {boolean} True if encryption key is available, false otherwise
	 *
	 * @example
	 * // Guard pattern before encryption operations
	 * if (!encryptionService.isReady()) {
	 *   showPasswordPrompt();
	 *   return;
	 * }
	 *
	 * // Safe to proceed with encryption
	 * const result = await encryptionService.encryptDraft(draft);
	 */
	isReady(): boolean {
		return keyDerivationService.isKeyReady();
	}
};
