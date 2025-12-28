// ===========================================
// THE UNSAID - Draft Service
// ===========================================
// Handles CRUD operations for drafts with automatic encryption/decryption
// All drafts are encrypted before storage and decrypted after retrieval
//
// ARCHITECTURE:
// This service is the main interface for draft operations. It:
// - Coordinates with encryptionService for transparent encryption
// - Manages all database operations via Supabase
// - Handles pagination, soft-delete, and trash functionality
// - Skips corrupted drafts gracefully to prevent total failure
//
// DATA FLOW:
// Save: Draft -> encryptionService.encrypt() -> Supabase INSERT/UPDATE
// Load: Supabase SELECT -> encryptionService.decrypt() -> Draft
//
// ERROR HANDLING:
// - All operations return { data, error } pattern
// - Never throws - errors are always in result object
// - Corrupted drafts are skipped in list operations (logged but not fatal)
//
// @module draftService
// @see {@link encryptionService} for encryption operations

import { supabase } from './supabase';
import { encryptionService } from './encryptionService';
import type { Draft, EncryptedDraft } from '$lib/types';

/**
 * Result type for save operations.
 *
 * @interface SaveDraftResult
 * @property {Draft|null} draft - The saved draft with timestamps, or null if save failed
 * @property {string|null} error - Error message if save failed, null otherwise
 */
export interface SaveDraftResult {
	draft: Draft | null;
	error: string | null;
}

/**
 * Result type for fetching multiple drafts.
 *
 * @interface GetDraftsResult
 * @property {Draft[]} drafts - Array of decrypted drafts (may be empty)
 * @property {string|null} error - Error message if fetch failed, null otherwise
 */
export interface GetDraftsResult {
	drafts: Draft[];
	error: string | null;
}

/**
 * Result type for delete operations.
 *
 * @interface DeleteDraftResult
 * @property {string|null} error - Error message if delete failed, null otherwise
 */
export interface DeleteDraftResult {
	error: string | null;
}

/**
 * Options for paginated draft fetching.
 *
 * @interface GetDraftsOptions
 * @property {number} [limit=20] - Maximum number of drafts to return
 * @property {number} [offset=0] - Number of drafts to skip
 * @property {boolean} [includeDeleted=false] - Whether to include soft-deleted drafts
 */
export interface GetDraftsOptions {
	limit?: number;
	offset?: number;
	includeDeleted?: boolean;
}

/**
 * Result type for paginated draft fetching.
 *
 * @interface GetDraftsPaginatedResult
 * @property {Draft[]} drafts - Array of decrypted drafts for current page
 * @property {number} total - Total count of all matching drafts
 * @property {boolean} hasMore - True if more drafts exist beyond current page
 * @property {string|null} error - Error message if fetch failed, null otherwise
 */
export interface GetDraftsPaginatedResult {
	drafts: Draft[];
	total: number;
	hasMore: boolean;
	error: string | null;
}

/**
 * Service for managing user drafts with zero-knowledge encryption.
 *
 * All drafts are automatically encrypted before storage and decrypted
 * after retrieval. This ensures the server never sees plaintext content.
 *
 * @example
 * // Save a new draft
 * const { draft, error } = await draftService.saveDraft({
 *   content: "Dear Mom, I've been meaning to tell you...",
 *   recipient: "Mom",
 *   intent: "Expressing gratitude",
 *   emotion: "grateful"
 * });
 *
 * if (draft) {
 *   console.log("Saved draft ID:", draft.id);
 * }
 *
 * @example
 * // Load all drafts for the history page
 * const { drafts, error } = await draftService.getDrafts();
 *
 * drafts.forEach(d => {
 *   console.log(`${d.recipient}: ${d.content.substring(0, 50)}...`);
 * });
 *
 * @example
 * // Soft delete (move to trash)
 * await draftService.softDeleteDraft(draftId);
 *
 * // Later, restore from trash
 * await draftService.restoreDraft(draftId);
 *
 * // Or permanently delete
 * await draftService.permanentlyDeleteDraft(draftId);
 */
export const draftService = {
	/**
	 * Save a draft (create or update).
	 *
	 * Automatically encrypts the draft before storage. If the draft has an ID,
	 * it updates the existing record. Otherwise, it creates a new one.
	 *
	 * @param {Omit<Draft, 'createdAt' | 'updatedAt'>} draft - The draft to save
	 * @param {string} [draft.id] - Optional ID for updates; omit for new drafts
	 * @param {string} draft.content - The main message content
	 * @param {string} draft.recipient - Who the message is for
	 * @param {string} draft.intent - The purpose of the message
	 * @param {string} [draft.emotion] - Optional emotional context
	 *
	 * @returns {Promise<SaveDraftResult>} The saved draft with timestamps or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Create a new draft
	 * const { draft, error } = await draftService.saveDraft({
	 *   content: "I love you and I'm sorry...",
	 *   recipient: "Partner",
	 *   intent: "Apologizing",
	 *   emotion: "regretful"
	 * });
	 *
	 * // draft.id is now set
	 * // draft.createdAt and draft.updatedAt are populated
	 *
	 * @example
	 * // Update an existing draft
	 * const { draft, error } = await draftService.saveDraft({
	 *   id: existingDraft.id,
	 *   content: updatedContent,
	 *   recipient: existingDraft.recipient,
	 *   intent: existingDraft.intent
	 * });
	 *
	 * // draft.updatedAt is now updated
	 *
	 * @security
	 * - Content is encrypted before leaving the browser
	 * - Server stores only ciphertext, IV, and timestamps
	 * - RLS ensures users can only access their own drafts
	 */
	async saveDraft(draft: Omit<Draft, 'createdAt' | 'updatedAt'>): Promise<SaveDraftResult> {
		// Check if encryption is ready first
		if (!encryptionService.isReady()) {
			return {
				draft: null,
				error: 'Please log in again to save encrypted drafts'
			};
		}

		// Encrypt the draft
		const { encryptedDraft, error: encryptError } = await encryptionService.encryptDraft({
			content: draft.content,
			recipient: draft.recipient,
			intent: draft.intent,
			emotion: draft.emotion
		});

		if (encryptError || !encryptedDraft) {
			return { draft: null, error: encryptError || 'Encryption failed' };
		}

		if (draft.id) {
			// Update existing draft
			const { data, error } = await supabase
				.from('drafts')
				.update({
					encrypted_content: encryptedDraft.encrypted_content,
					encrypted_metadata: encryptedDraft.encrypted_metadata,
					iv: encryptedDraft.iv,
					updated_at: new Date().toISOString()
				})
				.eq('id', draft.id)
				.select()
				.single();

			if (error) {
				return { draft: null, error: error.message };
			}

			return {
				draft: {
					id: data.id,
					content: draft.content,
					recipient: draft.recipient,
					intent: draft.intent,
					emotion: draft.emotion,
					createdAt: new Date(data.created_at),
					updatedAt: new Date(data.updated_at)
				},
				error: null
			};
		} else {
			// Create new draft
			const { data, error } = await supabase
				.from('drafts')
				.insert({
					encrypted_content: encryptedDraft.encrypted_content,
					encrypted_metadata: encryptedDraft.encrypted_metadata,
					iv: encryptedDraft.iv
				})
				.select()
				.single();

			if (error) {
				return { draft: null, error: error.message };
			}

			return {
				draft: {
					id: data.id,
					content: draft.content,
					recipient: draft.recipient,
					intent: draft.intent,
					emotion: draft.emotion,
					createdAt: new Date(data.created_at),
					updatedAt: new Date(data.updated_at)
				},
				error: null
			};
		}
	},

	/**
	 * Get all drafts for the current user.
	 *
	 * Automatically decrypts all drafts after retrieval. Excludes soft-deleted drafts.
	 * Drafts are sorted by most recently updated first.
	 *
	 * If a draft fails to decrypt (corrupted data), it is skipped and logged
	 * rather than causing the entire operation to fail.
	 *
	 * @returns {Promise<GetDraftsResult>} All user's drafts or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Load drafts for the history page
	 * const { drafts, error } = await draftService.getDrafts();
	 *
	 * if (error) {
	 *   showError(error);
	 *   return;
	 * }
	 *
	 * // Display drafts
	 * drafts.forEach(draft => {
	 *   console.log(`${draft.updatedAt}: ${draft.recipient}`);
	 * });
	 */
	async getDrafts(): Promise<GetDraftsResult> {
		// Check if encryption is ready first
		if (!encryptionService.isReady()) {
			return {
				drafts: [],
				error: 'Please log in again to access your encrypted drafts'
			};
		}

		const { data, error } = await supabase
			.from('drafts')
			.select('*')
			.is('deleted_at', null)
			.order('updated_at', { ascending: false });

		if (error) {
			return { drafts: [], error: error.message };
		}

		// Decrypt all drafts
		const decryptedDrafts: Draft[] = [];
		for (const encryptedDraft of data as EncryptedDraft[]) {
			const { draft, error: decryptError } = await encryptionService.decryptDraft({
				encrypted_content: encryptedDraft.encrypted_content,
				encrypted_metadata: encryptedDraft.encrypted_metadata,
				iv: encryptedDraft.iv
			});

			if (decryptError || !draft) {
				console.error('Failed to decrypt draft:', encryptedDraft.id, decryptError);
				continue; // Skip corrupted drafts rather than failing entirely
			}

			decryptedDrafts.push({
				id: encryptedDraft.id,
				content: draft.content,
				recipient: draft.recipient,
				intent: draft.intent,
				emotion: draft.emotion,
				createdAt: new Date(encryptedDraft.created_at),
				updatedAt: new Date(encryptedDraft.updated_at)
			});
		}

		return { drafts: decryptedDrafts, error: null };
	},

	/**
	 * Get a single draft by ID.
	 *
	 * Automatically decrypts the draft after retrieval.
	 *
	 * @param {string} id - The draft's unique identifier
	 *
	 * @returns {Promise<{draft: Draft | null; error: string | null}>} The draft or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Load a specific draft for editing
	 * const { draft, error } = await draftService.getDraft(draftId);
	 *
	 * if (draft) {
	 *   editor.setContent(draft.content);
	 *   recipientField.setValue(draft.recipient);
	 * }
	 */
	async getDraft(id: string): Promise<{ draft: Draft | null; error: string | null }> {
		// Check if encryption is ready first
		if (!encryptionService.isReady()) {
			return {
				draft: null,
				error: 'Please log in again to access your encrypted drafts'
			};
		}

		const { data, error } = await supabase.from('drafts').select('*').eq('id', id).single();

		if (error) {
			if (error.code === 'PGRST116') {
				return { draft: null, error: 'Draft not found' };
			}
			return { draft: null, error: error.message };
		}

		const encryptedDraft = data as EncryptedDraft;
		const { draft, error: decryptError } = await encryptionService.decryptDraft({
			encrypted_content: encryptedDraft.encrypted_content,
			encrypted_metadata: encryptedDraft.encrypted_metadata,
			iv: encryptedDraft.iv
		});

		if (decryptError || !draft) {
			return { draft: null, error: decryptError || 'Decryption failed' };
		}

		return {
			draft: {
				id: encryptedDraft.id,
				content: draft.content,
				recipient: draft.recipient,
				intent: draft.intent,
				emotion: draft.emotion,
				createdAt: new Date(encryptedDraft.created_at),
				updatedAt: new Date(encryptedDraft.updated_at)
			},
			error: null
		};
	},

	/**
	 * Delete a draft permanently.
	 *
	 * This immediately removes the draft from the database.
	 * For recoverable deletion, use softDeleteDraft() instead.
	 *
	 * @param {string} id - The draft's unique identifier
	 *
	 * @returns {Promise<DeleteDraftResult>} Error if deletion failed
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * const { error } = await draftService.deleteDraft(draftId);
	 *
	 * if (!error) {
	 *   removeFromUI(draftId);
	 * }
	 */
	async deleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').delete().eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Get drafts with pagination support.
	 *
	 * Use this for the history page with infinite scroll or pagination.
	 * Returns total count for pagination UI.
	 *
	 * @param {GetDraftsOptions} [options={}] - Pagination and filter options
	 * @param {number} [options.limit=20] - Max drafts per page
	 * @param {number} [options.offset=0] - Drafts to skip
	 * @param {boolean} [options.includeDeleted=false] - Include soft-deleted
	 *
	 * @returns {Promise<GetDraftsPaginatedResult>} Paginated drafts with metadata
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // First page
	 * const page1 = await draftService.getDraftsPaginated({ limit: 10 });
	 *
	 * // Next page
	 * const page2 = await draftService.getDraftsPaginated({
	 *   limit: 10,
	 *   offset: 10
	 * });
	 *
	 * if (page2.hasMore) {
	 *   showLoadMoreButton();
	 * }
	 */
	async getDraftsPaginated(options: GetDraftsOptions = {}): Promise<GetDraftsPaginatedResult> {
		const { limit = 20, offset = 0, includeDeleted = false } = options;

		// Check if encryption is ready first
		if (!encryptionService.isReady()) {
			return {
				drafts: [],
				total: 0,
				hasMore: false,
				error: 'Please log in again to access your encrypted drafts'
			};
		}

		// Build query with count
		let query = supabase.from('drafts').select('*', { count: 'exact' });

		// Filter out soft-deleted unless explicitly requested
		if (!includeDeleted) {
			query = query.is('deleted_at', null);
		}

		// Apply pagination and ordering
		const { data, error, count } = await query
			.order('updated_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			return { drafts: [], total: 0, hasMore: false, error: error.message };
		}

		// Decrypt all drafts
		const decryptedDrafts: Draft[] = [];
		for (const encryptedDraft of data as EncryptedDraft[]) {
			const { draft, error: decryptError } = await encryptionService.decryptDraft({
				encrypted_content: encryptedDraft.encrypted_content,
				encrypted_metadata: encryptedDraft.encrypted_metadata,
				iv: encryptedDraft.iv
			});

			if (decryptError || !draft) {
				console.error('Failed to decrypt draft:', encryptedDraft.id, decryptError);
				continue; // Skip corrupted drafts rather than failing entirely
			}

			decryptedDrafts.push({
				id: encryptedDraft.id,
				content: draft.content,
				recipient: draft.recipient,
				intent: draft.intent,
				emotion: draft.emotion,
				createdAt: new Date(encryptedDraft.created_at),
				updatedAt: new Date(encryptedDraft.updated_at)
			});
		}

		const total = count ?? 0;
		const hasMore = offset + limit < total;

		return { drafts: decryptedDrafts, total, hasMore, error: null };
	},

	/**
	 * Soft delete a draft (move to trash).
	 *
	 * Sets deleted_at timestamp but keeps the data. Can be restored later.
	 * This is the recommended way to delete drafts in the UI.
	 *
	 * @param {string} id - The draft's unique identifier
	 *
	 * @returns {Promise<DeleteDraftResult>} Error if soft deletion failed
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // User clicks delete
	 * const { error } = await draftService.softDeleteDraft(draftId);
	 *
	 * if (!error) {
	 *   showToast("Draft moved to trash");
	 *   removeFromList(draftId);
	 * }
	 */
	async softDeleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase
			.from('drafts')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Restore a soft-deleted draft from trash.
	 *
	 * Clears the deleted_at timestamp, making the draft visible again.
	 *
	 * @param {string} id - The draft's unique identifier
	 *
	 * @returns {Promise<DeleteDraftResult>} Error if restoration failed
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // User clicks restore in trash view
	 * const { error } = await draftService.restoreDraft(draftId);
	 *
	 * if (!error) {
	 *   showToast("Draft restored");
	 *   moveToMainList(draftId);
	 * }
	 */
	async restoreDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').update({ deleted_at: null }).eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Get soft-deleted drafts (trash).
	 *
	 * Returns all drafts that have been soft-deleted but not permanently deleted.
	 * Sorted by deletion time (most recent first).
	 *
	 * @returns {Promise<GetDraftsResult>} Deleted drafts that can be restored
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // Load trash view
	 * const { drafts, error } = await draftService.getDeletedDrafts();
	 *
	 * if (drafts.length > 0) {
	 *   showTrashUI(drafts);
	 * } else {
	 *   showEmptyTrash();
	 * }
	 */
	async getDeletedDrafts(): Promise<GetDraftsResult> {
		if (!encryptionService.isReady()) {
			return {
				drafts: [],
				error: 'Please log in again to access your encrypted drafts'
			};
		}

		const { data, error } = await supabase
			.from('drafts')
			.select('*')
			.not('deleted_at', 'is', null)
			.order('deleted_at', { ascending: false });

		if (error) {
			return { drafts: [], error: error.message };
		}

		// Decrypt all drafts
		const decryptedDrafts: Draft[] = [];
		for (const encryptedDraft of data as EncryptedDraft[]) {
			const { draft, error: decryptError } = await encryptionService.decryptDraft({
				encrypted_content: encryptedDraft.encrypted_content,
				encrypted_metadata: encryptedDraft.encrypted_metadata,
				iv: encryptedDraft.iv
			});

			if (decryptError || !draft) {
				console.error('Failed to decrypt draft:', encryptedDraft.id, decryptError);
				continue;
			}

			decryptedDrafts.push({
				id: encryptedDraft.id,
				content: draft.content,
				recipient: draft.recipient,
				intent: draft.intent,
				emotion: draft.emotion,
				createdAt: new Date(encryptedDraft.created_at),
				updatedAt: new Date(encryptedDraft.updated_at)
			});
		}

		return { drafts: decryptedDrafts, error: null };
	},

	/**
	 * Permanently delete a draft (hard delete).
	 *
	 * This completely removes the draft from the database.
	 * Only use for drafts already in trash (soft-deleted).
	 *
	 * WARNING: This cannot be undone!
	 *
	 * @param {string} id - The draft's unique identifier
	 *
	 * @returns {Promise<DeleteDraftResult>} Error if deletion failed
	 *
	 * @throws Never throws - all errors are returned in the result object
	 *
	 * @example
	 * // User confirms permanent deletion
	 * if (confirm("Delete forever? This cannot be undone.")) {
	 *   const { error } = await draftService.permanentlyDeleteDraft(draftId);
	 *
	 *   if (!error) {
	 *     removeFromTrash(draftId);
	 *   }
	 * }
	 */
	async permanentlyDeleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').delete().eq('id', id);
		return { error: error?.message || null };
	}
};
