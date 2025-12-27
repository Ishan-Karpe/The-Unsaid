// ===========================================
// THE UNSAID - Draft Service
// ===========================================
// Handles CRUD operations for drafts with automatic encryption/decryption
// All drafts are encrypted before storage and decrypted after retrieval

import { supabase } from './supabase';
import { encryptionService } from './encryptionService';
import type { Draft, EncryptedDraft } from '$lib/types';

export interface SaveDraftResult {
	draft: Draft | null;
	error: string | null;
}

export interface GetDraftsResult {
	drafts: Draft[];
	error: string | null;
}

export interface DeleteDraftResult {
	error: string | null;
}

export interface GetDraftsOptions {
	limit?: number;
	offset?: number;
	includeDeleted?: boolean;
}

export interface GetDraftsPaginatedResult {
	drafts: Draft[];
	total: number;
	hasMore: boolean;
	error: string | null;
}

export const draftService = {
	/**
	 * Save a draft (create or update)
	 * Automatically encrypts before storage
	 *
	 * @param draft - The draft to save (without timestamps)
	 * @returns The saved draft with timestamps or error
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
	 * Get all drafts for current user
	 * Automatically decrypts after retrieval
	 *
	 * @returns All user's drafts sorted by most recently updated
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
	 * Get a single draft by ID
	 * Automatically decrypts after retrieval
	 *
	 * @param id - The draft's unique identifier
	 * @returns The decrypted draft or error
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
	 * Delete a draft
	 *
	 * @param id - The draft's unique identifier
	 * @returns Error if deletion failed
	 */
	async deleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').delete().eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Get drafts with pagination support
	 * Automatically decrypts after retrieval
	 *
	 * @param options - Pagination and filter options
	 * @returns Paginated drafts with total count
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
	 * Soft delete a draft (moves to trash)
	 * Can be restored later
	 *
	 * @param id - The draft's unique identifier
	 * @returns Error if soft deletion failed
	 */
	async softDeleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase
			.from('drafts')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Restore a soft-deleted draft
	 *
	 * @param id - The draft's unique identifier
	 * @returns Error if restoration failed
	 */
	async restoreDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').update({ deleted_at: null }).eq('id', id);

		return { error: error?.message || null };
	},

	/**
	 * Get soft-deleted drafts (trash)
	 *
	 * @returns Deleted drafts that can be restored
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
	 * Permanently delete a draft (hard delete)
	 * Only call this for drafts already in trash
	 *
	 * @param id - The draft's unique identifier
	 * @returns Error if deletion failed
	 */
	async permanentlyDeleteDraft(id: string): Promise<DeleteDraftResult> {
		const { error } = await supabase.from('drafts').delete().eq('id', id);
		return { error: error?.message || null };
	}
};
