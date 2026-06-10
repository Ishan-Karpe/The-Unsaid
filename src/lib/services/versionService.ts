// ===========================================
// THE UNSAID - Draft Version Service
// ===========================================
// Maintains encrypted version history for drafts. Snapshots are ciphertext
// copies of the current `drafts` row taken just before autosave overwrites
// it — no plaintext ever leaves the browser and no re-encryption is needed
// at snapshot time (zero-knowledge preserved).
//
// POLICY:
// - Throttled: at most one snapshot per draft per SNAPSHOT_INTERVAL_MS
//   (a snapshot per 2-second autosave would be noise)
// - Bounded: only the most recent MAX_VERSIONS snapshots are kept per draft
// - Restoring first snapshots the current state, so a restore is always
//   itself undoable
//
// @module versionService
// @see {@link draftService} for the autosave path that triggers snapshots
// @see {@link kdfMigrationService} which re-encrypts versions on KDF upgrades

import { supabase } from './supabase';
import { encryptionService } from './encryptionService';
import { draftService } from './draftService';
import { isE2E } from './e2eStorage';
import type { Draft, EncryptedDraftVersion, DraftVersion } from '$lib/types';

/** Minimum age of the newest snapshot before another one is taken */
export const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/** Maximum snapshots retained per draft (oldest pruned first) */
export const MAX_VERSIONS = 20;

export interface ListVersionsResult {
	versions: DraftVersion[];
	error: string | null;
}

export interface SnapshotResult {
	/** True if a snapshot row was written (false when throttled or draft is new) */
	snapshotted: boolean;
	error: string | null;
}

export interface RestoreVersionResult {
	draft: Draft | null;
	error: string | null;
}

export const versionService = {
	/**
	 * Snapshot the current ciphertext of a draft if no recent snapshot exists.
	 *
	 * Called from the autosave path just before the draft row is overwritten.
	 * Failures are reported but should be treated as non-fatal by callers —
	 * losing a snapshot must never block saving the draft itself.
	 *
	 * @param {string} draftId - The draft to snapshot
	 * @param {{ force?: boolean }} [options] - force bypasses the throttle
	 *   (used before a restore so the pre-restore state is never lost)
	 *
	 * @returns {Promise<SnapshotResult>} Whether a snapshot was written
	 */
	async snapshotIfDue(draftId: string, options?: { force?: boolean }): Promise<SnapshotResult> {
		try {
			if (isE2E) {
				// E2E runs use local storage for drafts; version history is
				// exercised by unit tests instead
				return { snapshotted: false, error: null };
			}

			if (!options?.force) {
				const { data: newest, error: newestError } = await supabase
					.from('draft_versions')
					.select('created_at')
					.eq('draft_id', draftId)
					.order('created_at', { ascending: false })
					.limit(1);

				if (newestError) {
					return { snapshotted: false, error: newestError.message };
				}

				const newestAt = newest?.[0]?.created_at;
				if (newestAt && Date.now() - new Date(newestAt).getTime() < SNAPSHOT_INTERVAL_MS) {
					return { snapshotted: false, error: null };
				}
			}

			// Copy the draft's current ciphertext as-is
			const { data: draftRow, error: fetchError } = await supabase
				.from('drafts')
				.select('id, user_id, encrypted_content, encrypted_metadata, iv')
				.eq('id', draftId)
				.single();

			if (fetchError || !draftRow) {
				return { snapshotted: false, error: fetchError?.message || 'Draft not found' };
			}

			const { error: insertError } = await supabase.from('draft_versions').insert({
				draft_id: draftRow.id,
				user_id: draftRow.user_id,
				encrypted_content: draftRow.encrypted_content,
				encrypted_metadata: draftRow.encrypted_metadata,
				iv: draftRow.iv
			});

			if (insertError) {
				return { snapshotted: false, error: insertError.message };
			}

			await this.pruneVersions(draftId);

			return { snapshotted: true, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to snapshot draft';
			return { snapshotted: false, error: message };
		}
	},

	/**
	 * Delete all but the newest MAX_VERSIONS snapshots of a draft.
	 *
	 * Best-effort: pruning failures are returned but never block the caller.
	 */
	async pruneVersions(draftId: string): Promise<{ error: string | null }> {
		try {
			const { data, error } = await supabase
				.from('draft_versions')
				.select('id')
				.eq('draft_id', draftId)
				.order('created_at', { ascending: false });

			if (error) {
				return { error: error.message };
			}

			const excess = (data || []).slice(MAX_VERSIONS).map((row) => row.id);
			if (excess.length === 0) {
				return { error: null };
			}

			const { error: deleteError } = await supabase
				.from('draft_versions')
				.delete()
				.in('id', excess);

			return { error: deleteError ? deleteError.message : null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to prune versions';
			return { error: message };
		}
	},

	/**
	 * List a draft's snapshots, newest first, decrypted for display.
	 *
	 * Versions that fail to decrypt (e.g. created mid-KDF-migration) are
	 * skipped rather than failing the whole list.
	 *
	 * @returns {Promise<ListVersionsResult>} Decrypted versions or error
	 */
	async listVersions(draftId: string): Promise<ListVersionsResult> {
		try {
			const { data, error } = await supabase
				.from('draft_versions')
				.select('*')
				.eq('draft_id', draftId)
				.order('created_at', { ascending: false });

			if (error) {
				return { versions: [], error: error.message };
			}

			const versions: DraftVersion[] = [];
			for (const row of (data || []) as EncryptedDraftVersion[]) {
				const { draft, error: decryptError } = await encryptionService.decryptDraft({
					encrypted_content: row.encrypted_content,
					encrypted_metadata: row.encrypted_metadata,
					iv: row.iv
				});

				if (decryptError || !draft) {
					continue;
				}

				versions.push({
					id: row.id,
					content: draft.content,
					recipient: draft.recipient,
					intent: draft.intent,
					emotion: draft.emotion,
					createdAt: new Date(row.created_at)
				});
			}

			return { versions, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to list versions';
			return { versions: [], error: message };
		}
	},

	/**
	 * Restore a draft to a previous version.
	 *
	 * The current state is force-snapshotted first so the restore itself can
	 * be undone, then the version's plaintext is saved through the normal
	 * draft path (re-encrypting under the current key with a fresh IV).
	 *
	 * @returns {Promise<RestoreVersionResult>} The restored draft or error
	 */
	async restoreVersion(draftId: string, version: DraftVersion): Promise<RestoreVersionResult> {
		try {
			const { error: snapshotError } = await this.snapshotIfDue(draftId, { force: true });
			if (snapshotError) {
				return { draft: null, error: `Could not preserve current state: ${snapshotError}` };
			}

			const { draft, error } = await draftService.saveDraft({
				id: draftId,
				content: version.content,
				recipient: version.recipient,
				intent: version.intent,
				emotion: version.emotion
			});

			if (error || !draft) {
				return { draft: null, error: error || 'Failed to restore version' };
			}

			return { draft, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to restore version';
			return { draft: null, error: message };
		}
	}
};
