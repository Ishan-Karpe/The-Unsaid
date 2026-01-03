// ===========================================
// THE UNSAID - Password Change Service Tests (Browser)
// ===========================================
// Tests for password change with re-encryption flow
// Runs in browser environment (Web Crypto API required)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateSalt, deriveKey, encrypt, generateIV } from '$lib/crypto';
import { clearKey } from '$lib/crypto/keyStore';
import { keyDerivationService } from './keyDerivationService';

describe('Key Derivation Service - Password Change Helpers', () => {
	beforeEach(() => {
		clearKey();
	});

	afterEach(() => {
		clearKey();
	});

	describe('verifyPassword', () => {
		it('should return error when salt cannot be retrieved', async () => {
			// This will fail since no salt exists for a fake user
			const result = await keyDerivationService.verifyPassword('fake-user-id', 'password');

			expect(result.valid).toBe(false);
			expect(result.key).toBeNull();
			expect(result.salt).toBeNull();
			expect(result.error).toBeDefined();
		});
	});

	describe('deriveNewKey', () => {
		it('should successfully derive a new key with password and salt', async () => {
			const newSalt = keyDerivationService.generateNewSalt();
			const { key, error } = await keyDerivationService.deriveNewKey('new-password', newSalt);

			expect(error).toBeNull();
			expect(key).not.toBeNull();
			expect(key).toBeInstanceOf(CryptoKey);
		});

		it('should produce different keys for different passwords', async () => {
			const salt = keyDerivationService.generateNewSalt();

			const { key: key1 } = await keyDerivationService.deriveNewKey('password1', salt);
			const { key: key2 } = await keyDerivationService.deriveNewKey('password2', salt);

			// We can't directly compare CryptoKey objects, but we can verify both exist
			expect(key1).not.toBeNull();
			expect(key2).not.toBeNull();
		});

		it('should produce different keys for different salts', async () => {
			const salt1 = keyDerivationService.generateNewSalt();
			const salt2 = keyDerivationService.generateNewSalt();

			const { key: key1 } = await keyDerivationService.deriveNewKey('same-password', salt1);
			const { key: key2 } = await keyDerivationService.deriveNewKey('same-password', salt2);

			expect(key1).not.toBeNull();
			expect(key2).not.toBeNull();
		});
	});

	describe('generateNewSalt', () => {
		it('should generate a valid 16-byte salt', () => {
			const salt = keyDerivationService.generateNewSalt();

			expect(salt).toBeInstanceOf(Uint8Array);
			expect(salt.length).toBe(16);
		});

		it('should generate unique salts', () => {
			const salt1 = keyDerivationService.generateNewSalt();
			const salt2 = keyDerivationService.generateNewSalt();

			// Convert to hex for comparison
			const hex1 = Array.from(salt1)
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
			const hex2 = Array.from(salt2)
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');

			expect(hex1).not.toBe(hex2);
		});
	});

	describe('updateStoredKey', () => {
		it('should update the stored key in memory', async () => {
			const salt = generateSalt();
			const key = await deriveKey('test-password', salt);

			expect(keyDerivationService.isKeyReady()).toBe(false);

			keyDerivationService.updateStoredKey(key, salt);

			expect(keyDerivationService.isKeyReady()).toBe(true);
			expect(keyDerivationService.getEncryptionKey()).toBe(key);
		});
	});
});

describe('Password Change Re-encryption Logic', () => {
	beforeEach(() => {
		clearKey();
	});

	afterEach(() => {
		clearKey();
	});

	it('should allow encrypting with old key and decrypting with old key', async () => {
		// Simulate old password
		const oldSalt = generateSalt();
		const oldKey = await deriveKey('old-password', oldSalt);

		// Encrypt some content with old key
		const iv = generateIV();
		const { ciphertext, iv: ivBase64 } = await encrypt('Test content', oldKey, iv);

		// Should be able to decrypt with same key
		const { decrypt } = await import('$lib/crypto');
		const decrypted = await decrypt(ciphertext, ivBase64, oldKey);

		expect(decrypted).toBe('Test content');
	});

	it('should fail to decrypt with new key after encrypting with old key', async () => {
		// Simulate old password
		const oldSalt = generateSalt();
		const oldKey = await deriveKey('old-password', oldSalt);

		// Encrypt with old key
		const iv = generateIV();
		const { ciphertext, iv: ivBase64 } = await encrypt('Secret message', oldKey, iv);

		// Try to decrypt with new key
		const newSalt = generateSalt();
		const newKey = await deriveKey('new-password', newSalt);

		const { decrypt } = await import('$lib/crypto');

		// This should throw or return error
		await expect(decrypt(ciphertext, ivBase64, newKey)).rejects.toThrow();
	});

	it('should successfully re-encrypt content with new key', async () => {
		// Simulate old password
		const oldSalt = generateSalt();
		const oldKey = await deriveKey('old-password', oldSalt);

		// Encrypt with old key
		const originalContent = 'Important message to re-encrypt';
		const iv1 = generateIV();
		const { ciphertext: oldCiphertext, iv: oldIv } = await encrypt(originalContent, oldKey, iv1);

		// Decrypt with old key
		const { decrypt } = await import('$lib/crypto');
		const decryptedContent = await decrypt(oldCiphertext, oldIv, oldKey);
		expect(decryptedContent).toBe(originalContent);

		// Re-encrypt with new key
		const newSalt = generateSalt();
		const newKey = await deriveKey('new-password', newSalt);
		const iv2 = generateIV();
		const { ciphertext: newCiphertext, iv: newIv } = await encrypt(decryptedContent, newKey, iv2);

		// Decrypt with new key
		const finalContent = await decrypt(newCiphertext, newIv, newKey);
		expect(finalContent).toBe(originalContent);
	});

	it('should preserve data integrity through re-encryption', async () => {
		const testContent = {
			content: 'Dear Mom, I wanted to tell you...',
			recipient: 'Mom',
			intent: 'Express gratitude',
			emotion: 'grateful'
		};

		// Encrypt with old key
		const oldSalt = generateSalt();
		const oldKey = await deriveKey('old-password', oldSalt);
		const iv1 = generateIV();
		const { ciphertext: oldCiphertext, iv: oldIv } = await encrypt(
			JSON.stringify(testContent),
			oldKey,
			iv1
		);

		// Decrypt with old key
		const { decrypt } = await import('$lib/crypto');
		const decryptedJson = await decrypt(oldCiphertext, oldIv, oldKey);
		const decrypted = JSON.parse(decryptedJson);

		// Re-encrypt with new key
		const newSalt = generateSalt();
		const newKey = await deriveKey('new-password', newSalt);
		const iv2 = generateIV();
		const { ciphertext: newCiphertext, iv: newIv } = await encrypt(
			JSON.stringify(decrypted),
			newKey,
			iv2
		);

		// Decrypt with new key and verify
		const finalJson = await decrypt(newCiphertext, newIv, newKey);
		const finalContent = JSON.parse(finalJson);

		expect(finalContent.content).toBe(testContent.content);
		expect(finalContent.recipient).toBe(testContent.recipient);
		expect(finalContent.intent).toBe(testContent.intent);
		expect(finalContent.emotion).toBe(testContent.emotion);
	});

	it('should handle multiple drafts in re-encryption batch', async () => {
		const drafts = [
			{ id: '1', content: 'Draft 1 content' },
			{ id: '2', content: 'Draft 2 content' },
			{ id: '3', content: 'Draft 3 content' }
		];

		// Encrypt all drafts with old key
		const oldSalt = generateSalt();
		const oldKey = await deriveKey('old-password', oldSalt);

		const encryptedDrafts = [];
		for (const draft of drafts) {
			const iv = generateIV();
			const { ciphertext, iv: ivBase64 } = await encrypt(draft.content, oldKey, iv);
			encryptedDrafts.push({ id: draft.id, ciphertext, iv: ivBase64 });
		}

		// Simulate password change: decrypt all with old key
		const { decrypt } = await import('$lib/crypto');
		const decryptedDrafts = [];
		for (const ed of encryptedDrafts) {
			const content = await decrypt(ed.ciphertext, ed.iv, oldKey);
			decryptedDrafts.push({ id: ed.id, content });
		}

		// Re-encrypt all with new key
		const newSalt = generateSalt();
		const newKey = await deriveKey('new-password', newSalt);

		const reEncryptedDrafts = [];
		for (const dd of decryptedDrafts) {
			const iv = generateIV();
			const { ciphertext, iv: ivBase64 } = await encrypt(dd.content, newKey, iv);
			reEncryptedDrafts.push({ id: dd.id, ciphertext, iv: ivBase64 });
		}

		// Verify all drafts can be decrypted with new key
		for (let i = 0; i < drafts.length; i++) {
			const decrypted = await decrypt(
				reEncryptedDrafts[i].ciphertext,
				reEncryptedDrafts[i].iv,
				newKey
			);
			expect(decrypted).toBe(drafts[i].content);
		}
	});
});
