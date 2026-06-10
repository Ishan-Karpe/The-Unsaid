// ===========================================
// THE UNSAID - Version Service Tests (Browser)
// ===========================================
// Tests for encrypted draft version history: snapshot throttling, ciphertext
// copying, pruning, decrypted listing, and restore. Supabase, the encryption
// service, and the draft service are mocked; the service under test is real.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mutable mock state ------------------------------------------
let versionsData: Array<Record<string, unknown>> = [];
let draftRow: Record<string, unknown> | null = null;
let selectVersionsError: { message: string } | null = null;
let draftFetchError: { message: string } | null = null;
let insertError: { message: string } | null = null;
let deleteError: { message: string } | null = null;
const insertCalls: Array<Record<string, unknown>> = [];
const deleteCalls: Array<{ column: string; ids: string[] }> = [];
const fromSpy = vi.fn();

vi.mock('./supabase', () => ({
	supabase: {
		from: (table: string) => {
			fromSpy(table);
			const versionResult = () =>
				selectVersionsError
					? { data: null, error: selectVersionsError }
					: { data: versionsData, error: null };

			return {
				select: () => ({
					eq: () => {
						const ordered = {
							// awaited directly by pruneVersions / listVersions
							then(
								resolve: (v: { data: unknown; error: unknown }) => void,
								reject?: (e: unknown) => void
							) {
								return Promise.resolve(versionResult()).then(resolve, reject);
							},
							// .limit(1) used by snapshotIfDue throttle check
							limit: async (n: number) => {
								const res = versionResult();
								return res.error ? res : { data: (res.data as unknown[]).slice(0, n), error: null };
							}
						};
						return {
							order: () => ordered,
							// .single() used to fetch the drafts row
							single: async () =>
								draftFetchError
									? { data: null, error: draftFetchError }
									: { data: draftRow, error: null }
						};
					}
				}),
				insert: async (payload: Record<string, unknown>) => {
					if (insertError) return { error: insertError };
					insertCalls.push(payload);
					return { error: null };
				},
				delete: () => ({
					in: async (column: string, ids: string[]) => {
						if (deleteError) return { error: deleteError };
						deleteCalls.push({ column, ids });
						return { error: null };
					}
				})
			};
		}
	}
}));

// decryptDraft mock: ciphertext "enc:<content>" decrypts to <content>;
// "FAIL" ciphertext simulates an undecryptable version (mid-KDF-migration)
vi.mock('./encryptionService', () => ({
	encryptionService: {
		decryptDraft: vi.fn(
			async (row: { encrypted_content: string; encrypted_metadata: string; iv: string }) => {
				if (row.encrypted_content === 'FAIL') {
					return { draft: null, error: 'Decryption failed' };
				}
				const metadata = JSON.parse(row.encrypted_metadata);
				return {
					draft: {
						content: row.encrypted_content.replace(/^enc:/, ''),
						recipient: metadata.recipient ?? '',
						intent: metadata.intent ?? '',
						emotion: metadata.emotion ?? ''
					},
					error: null
				};
			}
		)
	}
}));

vi.mock('./draftService', () => ({
	draftService: {
		saveDraft: vi.fn()
	}
}));

import { versionService, MAX_VERSIONS } from './versionService';
import { draftService } from './draftService';

const DRAFT_ID = 'draft-1';
const USER_ID = 'user-123';

function makeVersionRow(id: string, ageMs: number, content = `enc:content-${id}`) {
	return {
		id,
		draft_id: DRAFT_ID,
		user_id: USER_ID,
		encrypted_content: content,
		encrypted_metadata: JSON.stringify({ recipient: 'Mom', intent: 'apologize', emotion: 'calm' }),
		iv: `iv-${id}`,
		created_at: new Date(Date.now() - ageMs).toISOString()
	};
}

describe('Version Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		versionsData = [];
		draftRow = {
			id: DRAFT_ID,
			user_id: USER_ID,
			encrypted_content: 'enc:current-draft',
			encrypted_metadata: JSON.stringify({ recipient: 'Mom' }),
			iv: 'iv-current'
		};
		selectVersionsError = null;
		draftFetchError = null;
		insertError = null;
		deleteError = null;
		insertCalls.length = 0;
		deleteCalls.length = 0;
		vi.mocked(draftService.saveDraft).mockResolvedValue({
			draft: {
				id: DRAFT_ID,
				content: 'restored',
				recipient: 'Mom',
				intent: 'apologize',
				emotion: 'calm',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			error: null
		} as Awaited<ReturnType<typeof draftService.saveDraft>>);
	});

	describe('snapshotIfDue', () => {
		it('is throttled: skips snapshot when the newest version is only 1 minute old', async () => {
			versionsData = [makeVersionRow('v1', 60 * 1000)];

			const result = await versionService.snapshotIfDue(DRAFT_ID);

			expect(result).toEqual({ snapshotted: false, error: null });
			expect(insertCalls).toHaveLength(0);
			expect(fromSpy).not.toHaveBeenCalledWith('drafts');
		});

		it('snapshots when the newest version is older than the interval, copying ciphertext as-is', async () => {
			versionsData = [makeVersionRow('v1', 11 * 60 * 1000)];

			const result = await versionService.snapshotIfDue(DRAFT_ID);

			expect(result).toEqual({ snapshotted: true, error: null });
			expect(insertCalls).toHaveLength(1);
			expect(insertCalls[0]).toEqual({
				draft_id: DRAFT_ID,
				user_id: USER_ID,
				encrypted_content: 'enc:current-draft',
				encrypted_metadata: JSON.stringify({ recipient: 'Mom' }),
				iv: 'iv-current'
			});
		});

		it('snapshots when no versions exist yet', async () => {
			versionsData = [];

			const result = await versionService.snapshotIfDue(DRAFT_ID);

			expect(result).toEqual({ snapshotted: true, error: null });
			expect(insertCalls).toHaveLength(1);
		});

		it('force bypasses the throttle even with a fresh snapshot present', async () => {
			versionsData = [makeVersionRow('v1', 1000)];

			const result = await versionService.snapshotIfDue(DRAFT_ID, { force: true });

			expect(result).toEqual({ snapshotted: true, error: null });
			expect(insertCalls).toHaveLength(1);
		});

		it('returns the supabase error without throwing when the draft fetch fails', async () => {
			draftFetchError = { message: 'row not found' };

			const result = await versionService.snapshotIfDue(DRAFT_ID, { force: true });

			expect(result).toEqual({ snapshotted: false, error: 'row not found' });
			expect(insertCalls).toHaveLength(0);
		});

		it('returns the supabase error without throwing when the insert fails', async () => {
			insertError = { message: 'insert denied' };

			const result = await versionService.snapshotIfDue(DRAFT_ID, { force: true });

			expect(result).toEqual({ snapshotted: false, error: 'insert denied' });
		});

		it('returns the supabase error when the throttle query fails', async () => {
			selectVersionsError = { message: 'select failed' };

			const result = await versionService.snapshotIfDue(DRAFT_ID);

			expect(result).toEqual({ snapshotted: false, error: 'select failed' });
		});
	});

	describe('pruneVersions', () => {
		it('deletes the oldest versions beyond MAX_VERSIONS', async () => {
			// 22 versions, newest first (matching the order(desc) the service requests)
			versionsData = Array.from({ length: 22 }, (_, i) =>
				makeVersionRow(`v${i + 1}`, (i + 1) * 60 * 1000)
			);

			const { error } = await versionService.pruneVersions(DRAFT_ID);

			expect(error).toBeNull();
			expect(deleteCalls).toHaveLength(1);
			expect(deleteCalls[0].column).toBe('id');
			expect(deleteCalls[0].ids).toEqual(['v21', 'v22']);
		});

		it('does not delete anything at or under the cap', async () => {
			versionsData = Array.from({ length: MAX_VERSIONS }, (_, i) =>
				makeVersionRow(`v${i + 1}`, (i + 1) * 60 * 1000)
			);

			const { error } = await versionService.pruneVersions(DRAFT_ID);

			expect(error).toBeNull();
			expect(deleteCalls).toHaveLength(0);
		});

		it('prunes after a successful snapshot', async () => {
			versionsData = Array.from({ length: 21 }, (_, i) =>
				makeVersionRow(`v${i + 1}`, (i + 11) * 60 * 1000)
			);

			const result = await versionService.snapshotIfDue(DRAFT_ID, { force: true });

			expect(result.snapshotted).toBe(true);
			expect(deleteCalls).toHaveLength(1);
			expect(deleteCalls[0].ids).toEqual(['v21']);
		});

		it('returns the supabase delete error without throwing', async () => {
			versionsData = Array.from({ length: 21 }, (_, i) =>
				makeVersionRow(`v${i + 1}`, (i + 1) * 60 * 1000)
			);
			deleteError = { message: 'delete failed' };

			const { error } = await versionService.pruneVersions(DRAFT_ID);

			expect(error).toBe('delete failed');
		});
	});

	describe('listVersions', () => {
		it('returns decrypted versions newest-first', async () => {
			versionsData = [
				makeVersionRow('v2', 60 * 1000, 'enc:newer text'),
				makeVersionRow('v1', 20 * 60 * 1000, 'enc:older text')
			];

			const { versions, error } = await versionService.listVersions(DRAFT_ID);

			expect(error).toBeNull();
			expect(versions).toHaveLength(2);
			expect(versions[0]).toMatchObject({
				id: 'v2',
				content: 'newer text',
				recipient: 'Mom',
				intent: 'apologize',
				emotion: 'calm'
			});
			expect(versions[0].createdAt).toBeInstanceOf(Date);
			expect(versions[1].content).toBe('older text');
			expect(versions[0].createdAt.getTime()).toBeGreaterThan(versions[1].createdAt.getTime());
		});

		it('skips versions that fail to decrypt instead of failing the whole list', async () => {
			versionsData = [
				makeVersionRow('v3', 1000, 'enc:good one'),
				makeVersionRow('v2', 2000, 'FAIL'),
				makeVersionRow('v1', 3000, 'enc:good two')
			];

			const { versions, error } = await versionService.listVersions(DRAFT_ID);

			expect(error).toBeNull();
			expect(versions.map((v) => v.id)).toEqual(['v3', 'v1']);
		});

		it('returns the supabase error without throwing', async () => {
			selectVersionsError = { message: 'permission denied' };

			const { versions, error } = await versionService.listVersions(DRAFT_ID);

			expect(versions).toEqual([]);
			expect(error).toBe('permission denied');
		});
	});

	describe('restoreVersion', () => {
		const version = {
			id: 'v1',
			content: 'old plaintext',
			recipient: 'Dad',
			intent: 'reconnect',
			emotion: 'hopeful',
			createdAt: new Date('2026-01-01T00:00:00Z')
		};

		it('force-snapshots the current state, then saves the version plaintext via draftService', async () => {
			// A fresh version exists — only force allows the pre-restore snapshot
			versionsData = [makeVersionRow('v1', 1000)];

			const { draft, error } = await versionService.restoreVersion(DRAFT_ID, version);

			expect(error).toBeNull();
			expect(insertCalls).toHaveLength(1); // throttle bypassed
			expect(draftService.saveDraft).toHaveBeenCalledTimes(1);
			expect(draftService.saveDraft).toHaveBeenCalledWith({
				id: DRAFT_ID,
				content: 'old plaintext',
				recipient: 'Dad',
				intent: 'reconnect',
				emotion: 'hopeful'
			});
			expect(draft).not.toBeNull();
			expect(draft?.id).toBe(DRAFT_ID);
		});

		it('does NOT save when the pre-restore snapshot fails', async () => {
			insertError = { message: 'storage full' };

			const { draft, error } = await versionService.restoreVersion(DRAFT_ID, version);

			expect(draft).toBeNull();
			expect(error).toBe('Could not preserve current state: storage full');
			expect(draftService.saveDraft).not.toHaveBeenCalled();
		});

		it('propagates a saveDraft error', async () => {
			vi.mocked(draftService.saveDraft).mockResolvedValue({
				draft: null,
				error: 'save failed'
			} as Awaited<ReturnType<typeof draftService.saveDraft>>);

			const { draft, error } = await versionService.restoreVersion(DRAFT_ID, version);

			expect(draft).toBeNull();
			expect(error).toBe('save failed');
		});
	});
});
