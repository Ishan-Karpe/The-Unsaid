// ===========================================
// THE UNSAID - KDF Migration Service Tests (Browser)
// ===========================================
// Tests for the versioned-KDF migration (legacy PBKDF2 iterations -> 600k).
// Runs in browser environment with REAL Web Crypto; only supabase,
// saltService, and the keyStore's setKey are mocked.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mutable mock state ------------------------------------------
let draftsData: Array<Record<string, unknown>> = [];
let versionsData: Array<Record<string, unknown>> = [];
let updateErrorForIds: Record<string, { message: string }> = {};
const updateCalls: Array<{
	id: string;
	payload: { encrypted_content: string; encrypted_metadata: string; iv: string };
}> = [];
const fromSpy = vi.fn();

vi.mock('./supabase', () => ({
	supabase: {
		from: (table: string) => {
			fromSpy(table);
			return {
				select: () => ({
					eq: async () => ({
						data: table === 'draft_versions' ? versionsData : draftsData,
						error: null
					})
				}),
				update: (payload: {
					encrypted_content: string;
					encrypted_metadata: string;
					iv: string;
				}) => ({
					eq: async (_col: string, id: string) => {
						if (updateErrorForIds[id]) {
							return { error: updateErrorForIds[id] };
						}
						updateCalls.push({ id, payload });
						return { error: null };
					}
				})
			};
		}
	}
}));

vi.mock('./saltService', () => ({
	saltService: {
		getSalt: vi.fn(),
		updateKdfIterations: vi.fn(async () => ({ error: null }))
	}
}));

vi.mock('$lib/crypto', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/crypto')>()),
	setKey: vi.fn()
}));

import { kdfMigrationService } from './kdfMigrationService';
import { saltService } from './saltService';
import {
	deriveKey,
	encrypt,
	decrypt,
	generateSalt,
	generateIV,
	setKey,
	CURRENT_PBKDF2_ITERATIONS
} from '$lib/crypto';

const USER_ID = 'user-123';
const PASSWORD = 'correct horse battery staple';
const LEGACY_ITERATIONS = 1000; // small for test speed; service reads it from getSalt

async function makeEncryptedDraft(id: string, content: string, metadata: object, key: CryptoKey) {
	const iv = generateIV();
	const { ciphertext: encrypted_content, iv: ivBase64 } = await encrypt(content, key, iv);
	const { ciphertext: encrypted_metadata } = await encrypt(JSON.stringify(metadata), key, iv);
	return {
		id,
		user_id: USER_ID,
		encrypted_content,
		encrypted_metadata,
		iv: ivBase64,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		deleted_at: null
	};
}

describe('KDF Migration Service', () => {
	let salt: Uint8Array;

	beforeEach(() => {
		vi.clearAllMocks();
		draftsData = [];
		versionsData = [];
		updateErrorForIds = {};
		updateCalls.length = 0;
		salt = generateSalt();
		vi.mocked(saltService.getSalt).mockResolvedValue({
			salt,
			kdfIterations: LEGACY_ITERATIONS,
			error: null
		});
		vi.mocked(saltService.updateKdfIterations).mockResolvedValue({ error: null });
	});

	it('migrates all legacy drafts, records new iteration count, and produces ciphertext decryptable with the new key', async () => {
		const legacyKey = await deriveKey(PASSWORD, salt, LEGACY_ITERATIONS);
		draftsData = [
			await makeEncryptedDraft('d1', 'First draft content', { recipient: 'Mom' }, legacyKey),
			await makeEncryptedDraft('d2', 'Second draft content', { recipient: 'Dad' }, legacyKey)
		];

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result.success).toBe(true);
		expect(result.draftsMigrated).toBe(2);
		expect(result.error).toBeNull();
		expect(updateCalls.map((c) => c.id).sort()).toEqual(['d1', 'd2']);
		expect(saltService.updateKdfIterations).toHaveBeenCalledWith(
			USER_ID,
			CURRENT_PBKDF2_ITERATIONS
		);
		expect(setKey).toHaveBeenCalledTimes(1);

		// Re-encrypted payloads must round-trip with the NEW (600k) key
		const newKey = await deriveKey(PASSWORD, salt, CURRENT_PBKDF2_ITERATIONS);
		const byId = Object.fromEntries(updateCalls.map((c) => [c.id, c.payload]));
		expect(await decrypt(byId['d1'].encrypted_content, byId['d1'].iv, newKey)).toBe(
			'First draft content'
		);
		expect(JSON.parse(await decrypt(byId['d1'].encrypted_metadata, byId['d1'].iv, newKey))).toEqual(
			{ recipient: 'Mom' }
		);
		expect(await decrypt(byId['d2'].encrypted_content, byId['d2'].iv, newKey)).toBe(
			'Second draft content'
		);
	});

	it('resumes an interrupted migration: skips drafts already under the new key', async () => {
		const legacyKey = await deriveKey(PASSWORD, salt, LEGACY_ITERATIONS);
		const newKey = await deriveKey(PASSWORD, salt, CURRENT_PBKDF2_ITERATIONS);
		draftsData = [
			await makeEncryptedDraft('already-migrated', 'Done already', { recipient: 'A' }, newKey),
			await makeEncryptedDraft('still-legacy', 'Needs migration', { recipient: 'B' }, legacyKey)
		];

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result.success).toBe(true);
		expect(result.draftsMigrated).toBe(1);
		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].id).toBe('still-legacy');
		expect(
			await decrypt(updateCalls[0].payload.encrypted_content, updateCalls[0].payload.iv, newKey)
		).toBe('Needs migration');
		expect(saltService.updateKdfIterations).toHaveBeenCalledWith(
			USER_ID,
			CURRENT_PBKDF2_ITERATIONS
		);
	});

	it('aborts on a draft update failure WITHOUT bumping kdf_iterations (resumable)', async () => {
		const legacyKey = await deriveKey(PASSWORD, salt, LEGACY_ITERATIONS);
		draftsData = [
			await makeEncryptedDraft('d1', 'Will fail to save', { recipient: 'X' }, legacyKey)
		];
		updateErrorForIds = { d1: { message: 'network error' } };

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result.success).toBe(false);
		expect(result.draftsMigrated).toBe(0);
		expect(result.error).toContain('d1');
		expect(saltService.updateKdfIterations).not.toHaveBeenCalled();
		expect(setKey).not.toHaveBeenCalled();
	});

	it('is a no-op success when the stored iteration count is already current', async () => {
		vi.mocked(saltService.getSalt).mockResolvedValue({
			salt,
			kdfIterations: CURRENT_PBKDF2_ITERATIONS,
			error: null
		});

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result).toEqual({ success: true, draftsMigrated: 0, error: null });
		expect(fromSpy).not.toHaveBeenCalled();
		expect(saltService.updateKdfIterations).not.toHaveBeenCalled();
	});

	it('also migrates draft_versions rows and counts them', async () => {
		const legacyKey = await deriveKey(PASSWORD, salt, LEGACY_ITERATIONS);
		draftsData = [await makeEncryptedDraft('d1', 'current text', { recipient: 'Mom' }, legacyKey)];
		versionsData = [
			await makeEncryptedDraft('v1', 'older text', { recipient: 'Mom' }, legacyKey),
			await makeEncryptedDraft('v2', 'oldest text', { recipient: 'Mom' }, legacyKey)
		];

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result.success).toBe(true);
		expect(result.draftsMigrated).toBe(3);
		expect(updateCalls.map((c) => c.id).sort()).toEqual(['d1', 'v1', 'v2']);
		expect(fromSpy).toHaveBeenCalledWith('draft_versions');
		expect(saltService.updateKdfIterations).toHaveBeenCalledWith(
			USER_ID,
			CURRENT_PBKDF2_ITERATIONS
		);

		// Migrated version ciphertext must decrypt with the new key
		const newKey = await deriveKey(PASSWORD, salt, CURRENT_PBKDF2_ITERATIONS);
		const v1 = updateCalls.find((c) => c.id === 'v1')!;
		expect(await decrypt(v1.payload.encrypted_content, v1.payload.iv, newKey)).toBe('older text');
	});

	it('does not bump kdf_iterations when a version row fails to update', async () => {
		const legacyKey = await deriveKey(PASSWORD, salt, LEGACY_ITERATIONS);
		draftsData = [await makeEncryptedDraft('d1', 'current text', { recipient: 'Mom' }, legacyKey)];
		versionsData = [await makeEncryptedDraft('v1', 'older text', { recipient: 'Mom' }, legacyKey)];
		updateErrorForIds = { v1: { message: 'network error' } };

		const result = await kdfMigrationService.migrateKdf(USER_ID, PASSWORD);

		expect(result.success).toBe(false);
		expect(result.error).toContain('v1');
		expect(saltService.updateKdfIterations).not.toHaveBeenCalled();
		expect(setKey).not.toHaveBeenCalled();
	});
});
