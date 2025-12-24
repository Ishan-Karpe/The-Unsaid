// ===========================================
// THE UNSAID - Crypto Cipher Tests (Browser)
// ===========================================
// Tests for AES-256-GCM encryption/decryption
// Runs in browser environment (Web Crypto API required)

import { describe, it, expect, beforeEach } from 'vitest';
import {
	generateSalt,
	generateIV,
	deriveKey,
	encrypt,
	decrypt,
	bufferToBase64,
	base64ToBuffer
} from './cipher';

describe('Crypto Cipher Module', () => {
	describe('generateSalt', () => {
		it('should generate a 16-byte salt', () => {
			const salt = generateSalt();
			expect(salt).toBeInstanceOf(Uint8Array);
			expect(salt.length).toBe(16);
		});

		it('should generate unique salts each time', () => {
			const salt1 = generateSalt();
			const salt2 = generateSalt();
			expect(bufferToBase64(salt1)).not.toBe(bufferToBase64(salt2));
		});
	});

	describe('generateIV', () => {
		it('should generate a 12-byte IV', () => {
			const iv = generateIV();
			expect(iv).toBeInstanceOf(Uint8Array);
			expect(iv.length).toBe(12);
		});

		it('should generate unique IVs each time', () => {
			const iv1 = generateIV();
			const iv2 = generateIV();
			expect(bufferToBase64(iv1)).not.toBe(bufferToBase64(iv2));
		});
	});

	describe('base64 conversion', () => {
		it('should convert buffer to base64 and back', () => {
			const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
			const base64 = bufferToBase64(original);
			const decoded = base64ToBuffer(base64);

			expect(decoded.length).toBe(original.length);
			for (let i = 0; i < original.length; i++) {
				expect(decoded[i]).toBe(original[i]);
			}
		});

		it('should handle empty buffer', () => {
			const empty = new Uint8Array([]);
			const base64 = bufferToBase64(empty);
			const decoded = base64ToBuffer(base64);

			expect(decoded.length).toBe(0);
		});

		it('should produce valid base64 string', () => {
			const data = generateSalt();
			const base64 = bufferToBase64(data);

			// Base64 should only contain valid characters
			expect(base64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
		});
	});

	describe('deriveKey', () => {
		it('should derive a CryptoKey from password and salt', async () => {
			const password = 'test-password-123';
			const salt = generateSalt();

			const key = await deriveKey(password, salt);

			expect(key).toBeDefined();
			expect(key.type).toBe('secret');
			expect(key.algorithm.name).toBe('AES-GCM');
			expect(key.usages).toContain('encrypt');
			expect(key.usages).toContain('decrypt');
		});

		it('should derive same key for same password and salt', async () => {
			const password = 'consistent-password';
			const salt = generateSalt();

			const key1 = await deriveKey(password, salt);
			const key2 = await deriveKey(password, salt);

			// Encrypt same text with both keys and compare results
			const testText = 'test message';
			const iv = generateIV();

			const encrypted1 = await encrypt(testText, key1, iv);
			const decrypted = await decrypt(encrypted1.ciphertext, encrypted1.iv, key2);

			expect(decrypted).toBe(testText);
		});

		it('should derive different keys for different passwords', async () => {
			const salt = generateSalt();

			const key1 = await deriveKey('password1', salt);
			const key2 = await deriveKey('password2', salt);

			// Encrypt with key1, try to decrypt with key2 should fail
			const testText = 'secret message';
			const encrypted = await encrypt(testText, key1);

			await expect(decrypt(encrypted.ciphertext, encrypted.iv, key2)).rejects.toThrow();
		});

		it('should derive different keys for different salts', async () => {
			const password = 'same-password';
			const salt1 = generateSalt();
			const salt2 = generateSalt();

			const key1 = await deriveKey(password, salt1);
			const key2 = await deriveKey(password, salt2);

			// Encrypt with key1, try to decrypt with key2 should fail
			const testText = 'secret message';
			const encrypted = await encrypt(testText, key1);

			await expect(decrypt(encrypted.ciphertext, encrypted.iv, key2)).rejects.toThrow();
		});
	});

	describe('encrypt/decrypt', () => {
		let testKey: CryptoKey;

		beforeEach(async () => {
			const salt = generateSalt();
			testKey = await deriveKey('test-password', salt);
		});

		it('should encrypt and decrypt text correctly', async () => {
			const plaintext = 'Hello, World!';

			const encrypted = await encrypt(plaintext, testKey);
			const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, testKey);

			expect(decrypted).toBe(plaintext);
		});

		it('should encrypt and decrypt empty string', async () => {
			const plaintext = '';

			const encrypted = await encrypt(plaintext, testKey);
			const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, testKey);

			expect(decrypted).toBe(plaintext);
		});

		it('should encrypt and decrypt unicode text', async () => {
			const plaintext = '你好世界 🌍 مرحبا שלום';

			const encrypted = await encrypt(plaintext, testKey);
			const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, testKey);

			expect(decrypted).toBe(plaintext);
		});

		it('should encrypt and decrypt long text', async () => {
			const plaintext = 'A'.repeat(10000);

			const encrypted = await encrypt(plaintext, testKey);
			const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, testKey);

			expect(decrypted).toBe(plaintext);
		});

		it('should produce different ciphertext each time (unique IVs)', async () => {
			const plaintext = 'Same message';

			const encrypted1 = await encrypt(plaintext, testKey);
			const encrypted2 = await encrypt(plaintext, testKey);

			expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
			expect(encrypted1.iv).not.toBe(encrypted2.iv);
		});

		it('should use provided IV when given', async () => {
			const plaintext = 'Test message';
			const sharedIv = generateIV();

			const encrypted1 = await encrypt(plaintext, testKey, sharedIv);
			const encrypted2 = await encrypt(plaintext, testKey, sharedIv);

			// Same IV + same plaintext + same key = same ciphertext
			expect(encrypted1.ciphertext).toBe(encrypted2.ciphertext);
			expect(encrypted1.iv).toBe(encrypted2.iv);
		});

		it('should return base64 encoded ciphertext and IV', async () => {
			const plaintext = 'Test';

			const encrypted = await encrypt(plaintext, testKey);

			// Should be valid base64
			expect(encrypted.ciphertext).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
			expect(encrypted.iv).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
		});

		it('should fail to decrypt with wrong IV', async () => {
			const plaintext = 'Secret';

			const encrypted = await encrypt(plaintext, testKey);
			const wrongIv = bufferToBase64(generateIV());

			await expect(decrypt(encrypted.ciphertext, wrongIv, testKey)).rejects.toThrow();
		});

		it('should fail to decrypt tampered ciphertext', async () => {
			const plaintext = 'Original message';

			const encrypted = await encrypt(plaintext, testKey);

			// Tamper with ciphertext
			const tamperedCiphertext = encrypted.ciphertext.slice(0, -4) + 'XXXX';

			await expect(decrypt(tamperedCiphertext, encrypted.iv, testKey)).rejects.toThrow();
		});
	});

	describe('encryption security properties', () => {
		it('should not leak plaintext in ciphertext', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			const plaintext = 'VISIBLE_SECRET_DATA';

			const encrypted = await encrypt(plaintext, key);

			// Ciphertext should not contain plaintext
			expect(encrypted.ciphertext).not.toContain(plaintext);
			expect(encrypted.ciphertext).not.toContain('VISIBLE');
			expect(encrypted.ciphertext).not.toContain('SECRET');
		});

		it('should produce ciphertext longer than plaintext (includes auth tag)', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			const plaintext = 'Short';

			const encrypted = await encrypt(plaintext, key);
			const ciphertextBytes = base64ToBuffer(encrypted.ciphertext);

			// GCM adds 16-byte auth tag, plus padding for base64
			expect(ciphertextBytes.length).toBeGreaterThan(plaintext.length);
		});
	});
});
