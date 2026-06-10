// ===========================================
// THE UNSAID - KDF Migration Service
// ===========================================
// Upgrades a user's key derivation from a legacy PBKDF2 iteration count
// to CURRENT_PBKDF2_ITERATIONS by re-encrypting all drafts under the new
// key. Runs on login (the only moment the password is available).
//
// SAFETY DESIGN:
// - Each draft is decrypted with the NEW key first, falling back to the
//   legacy key. An interrupted migration is therefore resumable: already
//   migrated drafts are recognized and skipped on the next attempt.
// - `user_salts.kdf_iterations` is updated LAST, only after every draft
//   has been successfully re-encrypted. Until then logins keep deriving
//   the legacy key and re-running this migration.
// - Ciphertext is only ever replaced by a successfully round-tripped
//   re-encryption, so no data-loss window exists.
//
// @module kdfMigrationService
// @see {@link passwordChangeService} for the same re-encryption pattern

import { supabase } from './supabase';
import { saltService } from './saltService';
import {
	deriveKey,
	encrypt,
	decrypt,
	generateIV,
	setKey,
	CURRENT_PBKDF2_ITERATIONS
} from '$lib/crypto';
import type { EncryptedDraft, EncryptedDraftVersion } from '$lib/types';

/**
 * Re-encrypt a table's ciphertext rows from `legacyKey` to `newKey`.
 *
 * Rows already readable with the new key are skipped, which is what makes
 * an interrupted migration resumable. Stops at the first failure so
 * `kdf_iterations` is never advanced past unmigrated data.
 */
async function migrateRows(
	table: 'drafts' | 'draft_versions',
	rows: Array<
		Pick<
			EncryptedDraft | EncryptedDraftVersion,
			'id' | 'encrypted_content' | 'encrypted_metadata' | 'iv'
		>
	>,
	legacyKey: CryptoKey,
	newKey: CryptoKey
): Promise<{ migrated: number; error: string | null }> {
	let migrated = 0;

	for (const row of rows) {
		// New key first: succeeds for rows a previous (interrupted)
		// run already migrated, which need no further work.
		try {
			await decrypt(row.encrypted_content, row.iv, newKey);
			continue;
		} catch {
			// Not yet migrated — fall through to the legacy key
		}

		let content: string;
		let metadataJson: string;
		try {
			content = await decrypt(row.encrypted_content, row.iv, legacyKey);
			metadataJson = await decrypt(row.encrypted_metadata, row.iv, legacyKey);
		} catch {
			return {
				migrated,
				error: `Failed to decrypt ${table} row ${row.id} during KDF migration`
			};
		}

		const iv = generateIV();
		const { ciphertext: encryptedContent, iv: ivBase64 } = await encrypt(content, newKey, iv);
		const { ciphertext: encryptedMetadata } = await encrypt(metadataJson, newKey, iv);

		const { error: updateError } = await supabase
			.from(table)
			.update({
				encrypted_content: encryptedContent,
				encrypted_metadata: encryptedMetadata,
				iv: ivBase64
			})
			.eq('id', row.id);

		if (updateError) {
			// Abort without touching kdf_iterations: next login re-derives
			// the legacy key and this migration resumes where it stopped.
			return {
				migrated,
				error: `Failed to update ${table} row ${row.id}: ${updateError.message}`
			};
		}

		migrated++;
	}

	return { migrated, error: null };
}

export interface KdfMigrationResult {
	success: boolean;
	/** Drafts re-encrypted in this run (already-migrated drafts are skipped) */
	draftsMigrated: number;
	error: string | null;
}

export const kdfMigrationService = {
	/**
	 * Re-encrypt all of a user's drafts under a key derived with the
	 * current PBKDF2 iteration count, then record the new count.
	 *
	 * Idempotent and resumable — safe to call again after a failure or
	 * an interrupted run.
	 *
	 * @param userId - The user's unique identifier
	 * @param password - The user's password (available at login; not stored)
	 */
	async migrateKdf(userId: string, password: string): Promise<KdfMigrationResult> {
		try {
			const { salt, kdfIterations, error: saltError } = await saltService.getSalt(userId);

			if (saltError || !salt) {
				return { success: false, draftsMigrated: 0, error: saltError || 'Failed to get salt' };
			}

			if (kdfIterations >= CURRENT_PBKDF2_ITERATIONS) {
				// Already migrated (e.g. by a concurrent session)
				return { success: true, draftsMigrated: 0, error: null };
			}

			const legacyKey = await deriveKey(password, salt, kdfIterations);
			const newKey = await deriveKey(password, salt, CURRENT_PBKDF2_ITERATIONS);

			const { data: encryptedDrafts, error: fetchError } = await supabase
				.from('drafts')
				.select('*')
				.eq('user_id', userId);

			if (fetchError) {
				return {
					success: false,
					draftsMigrated: 0,
					error: `Failed to fetch drafts: ${fetchError.message}`
				};
			}

			const draftsResult = await migrateRows(
				'drafts',
				(encryptedDrafts || []) as EncryptedDraft[],
				legacyKey,
				newKey
			);
			if (draftsResult.error) {
				return { success: false, draftsMigrated: draftsResult.migrated, error: draftsResult.error };
			}
			let migrated = draftsResult.migrated;

			// Version snapshots are ciphertext copies under the same key and
			// must be migrated too, or history becomes unreadable.
			const { data: versionRows, error: versionsError } = await supabase
				.from('draft_versions')
				.select('*')
				.eq('user_id', userId);

			if (versionsError) {
				return {
					success: false,
					draftsMigrated: migrated,
					error: `Failed to fetch draft versions: ${versionsError.message}`
				};
			}

			const versionsResult = await migrateRows(
				'draft_versions',
				(versionRows || []) as EncryptedDraftVersion[],
				legacyKey,
				newKey
			);
			migrated += versionsResult.migrated;
			if (versionsResult.error) {
				return { success: false, draftsMigrated: migrated, error: versionsResult.error };
			}

			// Every draft is now under the new key — record the new count.
			const { error: iterError } = await saltService.updateKdfIterations(
				userId,
				CURRENT_PBKDF2_ITERATIONS
			);

			if (iterError) {
				// Drafts are migrated but the count update failed. The next login's
				// migration run will find all drafts decrypt with the new key and
				// simply retry this update.
				return { success: false, draftsMigrated: migrated, error: iterError };
			}

			// Swap the in-memory key so the rest of the session uses the new one
			setKey(newKey, salt);

			return { success: true, draftsMigrated: migrated, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'KDF migration failed';
			return { success: false, draftsMigrated: 0, error: message };
		}
	}
};
