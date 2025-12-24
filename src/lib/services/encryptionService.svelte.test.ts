// ===========================================
// THE UNSAID - Encryption Service Tests (Browser)
// ===========================================
// Tests for high-level draft encryption/decryption API
// Runs in browser environment (Web Crypto API required)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptionService } from './encryptionService';
import { generateSalt, deriveKey } from '$lib/crypto';
import { setKey, clearKey } from '$lib/crypto/keyStore';

describe('Encryption Service', () => {
	// Set up a test key before tests that need it
	async function setupTestKey() {
		const salt = generateSalt();
		const key = await deriveKey('test-password', salt);
		setKey(key, salt);
		return { key, salt };
	}

	beforeEach(() => {
		clearKey();
	});

	afterEach(() => {
		clearKey();
	});

	describe('isReady', () => {
		it('should return false when no key is set', () => {
			expect(encryptionService.isReady()).toBe(false);
		});

		it('should return true when key is set', async () => {
			await setupTestKey();
			expect(encryptionService.isReady()).toBe(true);
		});
	});

	describe('encryptDraft', () => {
		it('should return error when key is not available', async () => {
			const draft = {
				content: 'Test content',
				recipient: 'Mom',
				intent: 'appreciation'
			};

			const result = await encryptionService.encryptDraft(draft);

			expect(result.encryptedDraft).toBeNull();
			expect(result.error).toBe('Encryption key not available');
		});

		it('should encrypt draft successfully', async () => {
			await setupTestKey();

			const draft = {
				content: 'Dear Mom, I love you',
				recipient: 'Mom',
				intent: 'love',
				emotion: 'grateful'
			};

			const result = await encryptionService.encryptDraft(draft);

			expect(result.error).toBeNull();
			expect(result.encryptedDraft).not.toBeNull();
			expect(result.encryptedDraft?.encrypted_content).toBeDefined();
			expect(result.encryptedDraft?.encrypted_metadata).toBeDefined();
			expect(result.encryptedDraft?.iv).toBeDefined();
		});

		it('should produce different ciphertext for same draft (unique IV)', async () => {
			await setupTestKey();

			const draft = {
				content: 'Same content',
				recipient: 'Same recipient',
				intent: 'same intent'
			};

			const result1 = await encryptionService.encryptDraft(draft);
			const result2 = await encryptionService.encryptDraft(draft);

			expect(result1.encryptedDraft?.encrypted_content).not.toBe(
				result2.encryptedDraft?.encrypted_content
			);
			expect(result1.encryptedDraft?.iv).not.toBe(result2.encryptedDraft?.iv);
		});

		it('should encrypt content and metadata with same IV', async () => {
			await setupTestKey();

			const draft = {
				content: 'Test',
				recipient: 'Test',
				intent: 'test'
			};

			const result = await encryptionService.encryptDraft(draft);

			// Both use same IV (single iv field in result)
			expect(result.encryptedDraft?.iv).toBeDefined();
			expect(typeof result.encryptedDraft?.iv).toBe('string');
		});

		it('should handle empty content', async () => {
			await setupTestKey();

			const draft = {
				content: '',
				recipient: 'Someone',
				intent: 'greeting'
			};

			const result = await encryptionService.encryptDraft(draft);

			expect(result.error).toBeNull();
			expect(result.encryptedDraft).not.toBeNull();
		});

		it('should handle unicode content', async () => {
			await setupTestKey();

			const draft = {
				content: '你好 🌍 مرحبا שלום',
				recipient: 'Friend',
				intent: 'greeting',
				emotion: '😊'
			};

			const result = await encryptionService.encryptDraft(draft);

			expect(result.error).toBeNull();
			expect(result.encryptedDraft).not.toBeNull();
		});

		it('should handle optional emotion field', async () => {
			await setupTestKey();

			const draftWithEmotion = {
				content: 'Test',
				recipient: 'Test',
				intent: 'test',
				emotion: 'happy'
			};

			const draftWithoutEmotion = {
				content: 'Test',
				recipient: 'Test',
				intent: 'test'
			};

			const result1 = await encryptionService.encryptDraft(draftWithEmotion);
			const result2 = await encryptionService.encryptDraft(draftWithoutEmotion);

			expect(result1.error).toBeNull();
			expect(result2.error).toBeNull();
		});
	});

	describe('decryptDraft', () => {
		it('should return error when key is not available', async () => {
			const encryptedDraft = {
				encrypted_content: 'dummy',
				encrypted_metadata: 'dummy',
				iv: 'dummy'
			};

			const result = await encryptionService.decryptDraft(encryptedDraft);

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Encryption key not available');
		});

		it('should decrypt draft successfully', async () => {
			await setupTestKey();

			const originalDraft = {
				content: 'Dear Friend, thank you',
				recipient: 'Best Friend',
				intent: 'gratitude',
				emotion: 'thankful'
			};

			const encrypted = await encryptionService.encryptDraft(originalDraft);
			expect(encrypted.encryptedDraft).not.toBeNull();

			const decrypted = await encryptionService.decryptDraft(encrypted.encryptedDraft!);

			expect(decrypted.error).toBeNull();
			expect(decrypted.draft).not.toBeNull();
			expect(decrypted.draft?.content).toBe(originalDraft.content);
			expect(decrypted.draft?.recipient).toBe(originalDraft.recipient);
			expect(decrypted.draft?.intent).toBe(originalDraft.intent);
			expect(decrypted.draft?.emotion).toBe(originalDraft.emotion);
		});

		it('should decrypt draft without emotion', async () => {
			await setupTestKey();

			const originalDraft = {
				content: 'Hello',
				recipient: 'World',
				intent: 'greeting'
			};

			const encrypted = await encryptionService.encryptDraft(originalDraft);
			const decrypted = await encryptionService.decryptDraft(encrypted.encryptedDraft!);

			expect(decrypted.error).toBeNull();
			expect(decrypted.draft?.content).toBe(originalDraft.content);
			expect(decrypted.draft?.emotion).toBeUndefined();
		});

		it('should decrypt unicode content correctly', async () => {
			await setupTestKey();

			const originalDraft = {
				content: '你好世界 🌍 مرحبا',
				recipient: 'International Friend',
				intent: 'greeting'
			};

			const encrypted = await encryptionService.encryptDraft(originalDraft);
			const decrypted = await encryptionService.decryptDraft(encrypted.encryptedDraft!);

			expect(decrypted.draft?.content).toBe(originalDraft.content);
		});

		it('should fail to decrypt with wrong key', async () => {
			// Encrypt with one key
			const salt1 = generateSalt();
			const key1 = await deriveKey('password1', salt1);
			setKey(key1, salt1);

			const draft = {
				content: 'Secret message',
				recipient: 'Someone',
				intent: 'private'
			};

			const encrypted = await encryptionService.encryptDraft(draft);

			// Try to decrypt with different key
			const salt2 = generateSalt();
			const key2 = await deriveKey('password2', salt2);
			setKey(key2, salt2);

			const decrypted = await encryptionService.decryptDraft(encrypted.encryptedDraft!);

			expect(decrypted.draft).toBeNull();
			expect(decrypted.error).toBeDefined();
		});

		it('should fail to decrypt tampered ciphertext', async () => {
			await setupTestKey();

			const draft = {
				content: 'Original content',
				recipient: 'Someone',
				intent: 'test'
			};

			const encrypted = await encryptionService.encryptDraft(draft);

			// Tamper with the encrypted content
			const tampered = {
				...encrypted.encryptedDraft!,
				encrypted_content: encrypted.encryptedDraft!.encrypted_content.slice(0, -4) + 'XXXX'
			};

			const decrypted = await encryptionService.decryptDraft(tampered);

			expect(decrypted.draft).toBeNull();
			expect(decrypted.error).toBeDefined();
		});
	});

	describe('round-trip encryption', () => {
		it('should preserve all draft fields through encryption/decryption', async () => {
			await setupTestKey();

			const testCases = [
				{
					content: 'Short',
					recipient: 'A',
					intent: 'test'
				},
				{
					content: 'A'.repeat(10000),
					recipient: 'Long content test',
					intent: 'stress test',
					emotion: 'anxious'
				},
				{
					content: 'Special chars: <>&"\'`',
					recipient: 'HTML test',
					intent: 'security'
				},
				{
					content: 'Line 1\nLine 2\n\nLine 4',
					recipient: 'Newline test',
					intent: 'formatting'
				}
			];

			for (const original of testCases) {
				const encrypted = await encryptionService.encryptDraft(original);
				const decrypted = await encryptionService.decryptDraft(encrypted.encryptedDraft!);

				expect(decrypted.draft?.content).toBe(original.content);
				expect(decrypted.draft?.recipient).toBe(original.recipient);
				expect(decrypted.draft?.intent).toBe(original.intent);
				expect(decrypted.draft?.emotion).toBe(original.emotion);
			}
		});
	});
});
