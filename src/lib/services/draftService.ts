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
	}
};
