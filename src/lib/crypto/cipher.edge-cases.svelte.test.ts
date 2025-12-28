// ===========================================
// THE UNSAID - Cipher Edge Case Tests
// ===========================================
// Additional unit tests for encryption edge cases including
// IV uniqueness, tampering detection, and key derivation edge cases

import { describe, it, expect, beforeAll } from 'vitest';
import {
	generateSalt,
	generateIV,
	deriveKey,
	encrypt,
	decrypt,
	bufferToBase64,
	base64ToBuffer
} from './cipher';

describe('Cipher Edge Cases', () => {
	let testKey: CryptoKey;

	beforeAll(async () => {
		const salt = generateSalt();
		testKey = await deriveKey('test-password-for-edge-cases', salt);
	});

	describe('Empty and Edge Inputs', () => {
		it('should handle empty string encryption', async () => {
			const { ciphertext, iv } = await encrypt('', testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe('');
		});

		it('should handle whitespace-only content', async () => {
			const whitespace = '   \n\t\r\n   ';
			const { ciphertext, iv } = await encrypt(whitespace, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(whitespace);
		});

		it('should handle single character encryption', async () => {
			const singleChar = 'a';
			const { ciphertext, iv } = await encrypt(singleChar, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(singleChar);
		});

		it('should handle very long strings (100KB)', async () => {
			const longString = 'A'.repeat(100 * 1024);
			const { ciphertext, iv } = await encrypt(longString, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(longString);
		});

		it('should handle string with repeated patterns', async () => {
			const repeated = 'abc'.repeat(1000);
			const { ciphertext, iv } = await encrypt(repeated, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(repeated);
		});
	});

	describe('Unicode and Special Characters', () => {
		it('should handle all unicode planes', async () => {
			const unicode = '🎉👨‍👩‍👧‍👦🏳️‍🌈日本語العربيةעברית中文한국어';
			const { ciphertext, iv } = await encrypt(unicode, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(unicode);
		});

		it('should handle null characters', async () => {
			const withNull = 'before\0after';
			const { ciphertext, iv } = await encrypt(withNull, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(withNull);
		});

		it('should handle newlines and control characters', async () => {
			const withControls = 'line1\nline2\rline3\r\nline4\ttab';
			const { ciphertext, iv } = await encrypt(withControls, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(withControls);
		});

		it('should handle combining characters and diacritics', async () => {
			const combining = 'café naïve résumé ñoño';
			const { ciphertext, iv } = await encrypt(combining, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(combining);
		});

		it('should handle zero-width characters', async () => {
			const zeroWidth = 'test\u200B\u200C\u200Dword'; // ZWS, ZWNJ, ZWJ
			const { ciphertext, iv } = await encrypt(zeroWidth, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(zeroWidth);
		});

		it('should handle right-to-left text', async () => {
			const rtl = 'مرحبا بالعالم שלום עולם';
			const { ciphertext, iv } = await encrypt(rtl, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(rtl);
		});

		it('should handle mathematical symbols', async () => {
			const math = '∀x∈ℝ: x² ≥ 0 ∧ ∫f(x)dx = F(x) + C';
			const { ciphertext, iv } = await encrypt(math, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(math);
		});

		it('should handle HTML-like content safely', async () => {
			const html = '<script>alert("xss")</script><div class="test">content</div>';
			const { ciphertext, iv } = await encrypt(html, testKey);
			const decrypted = await decrypt(ciphertext, iv, testKey);
			expect(decrypted).toBe(html);
		});
	});

	describe('IV Uniqueness', () => {
		it('should generate unique IVs for each encryption', async () => {
			const ivs = new Set<string>();
			const text = 'same text';

			for (let i = 0; i < 100; i++) {
				const { iv } = await encrypt(text, testKey);
				expect(ivs.has(iv)).toBe(false);
				ivs.add(iv);
			}
		});

		it('should have correct IV length (12 bytes / 96 bits)', () => {
			const iv = generateIV();
			expect(iv.length).toBe(12);
		});

		it('should produce statistically unique IVs', () => {
			// Generate 1000 IVs and check none are duplicates
			const ivs = new Set<string>();
			for (let i = 0; i < 1000; i++) {
				const iv = generateIV();
				const ivHex = bufferToBase64(iv);
				expect(ivs.has(ivHex)).toBe(false);
				ivs.add(ivHex);
			}
		});
	});

	describe('Salt Uniqueness', () => {
		it('should generate unique salts', () => {
			const salts = new Set<string>();
			for (let i = 0; i < 100; i++) {
				const salt = generateSalt();
				const saltB64 = bufferToBase64(salt);
				expect(salts.has(saltB64)).toBe(false);
				salts.add(saltB64);
			}
		});

		it('should have correct salt length (16 bytes / 128 bits)', () => {
			const salt = generateSalt();
			expect(salt.length).toBe(16);
		});
	});

	describe('Tampering Detection', () => {
		it('should fail decryption with wrong key', async () => {
			const salt = generateSalt();
			const wrongKey = await deriveKey('wrong-password', salt);
			const { ciphertext, iv } = await encrypt('secret', testKey);

			await expect(decrypt(ciphertext, iv, wrongKey)).rejects.toThrow();
		});

		it('should fail decryption with modified ciphertext', async () => {
			const { ciphertext, iv } = await encrypt('secret', testKey);

			// Flip a bit in the ciphertext
			const bytes = base64ToBuffer(ciphertext);
			bytes[0] ^= 0xff;
			const modifiedCiphertext = bufferToBase64(bytes);

			await expect(decrypt(modifiedCiphertext, iv, testKey)).rejects.toThrow();
		});

		it('should fail decryption with modified IV', async () => {
			const { ciphertext, iv } = await encrypt('secret', testKey);

			// Flip a bit in the IV
			const ivBytes = base64ToBuffer(iv);
			ivBytes[0] ^= 0xff;
			const modifiedIV = bufferToBase64(ivBytes);

			await expect(decrypt(ciphertext, modifiedIV, testKey)).rejects.toThrow();
		});

		it('should fail decryption with truncated ciphertext', async () => {
			const { ciphertext, iv } = await encrypt('secret message', testKey);

			// Truncate ciphertext
			const truncated = ciphertext.slice(0, -8);

			await expect(decrypt(truncated, iv, testKey)).rejects.toThrow();
		});

		it('should fail decryption with appended data', async () => {
			const { ciphertext, iv } = await encrypt('secret', testKey);

			// Append extra data
			const appended = ciphertext + 'AAAA';

			await expect(decrypt(appended, iv, testKey)).rejects.toThrow();
		});
	});

	describe('Key Derivation Edge Cases', () => {
		it('should derive same key from same password and salt', async () => {
			const password = 'test-password';
			const salt = generateSalt();

			const key1 = await deriveKey(password, salt);
			const key2 = await deriveKey(password, salt);

			// Encrypt with key1, decrypt with key2
			const { ciphertext, iv } = await encrypt('test', key1);
			const decrypted = await decrypt(ciphertext, iv, key2);
			expect(decrypted).toBe('test');
		});

		it('should derive different keys from same password but different salt', async () => {
			const password = 'test-password';
			const salt1 = generateSalt();
			const salt2 = generateSalt();

			const key1 = await deriveKey(password, salt1);
			const key2 = await deriveKey(password, salt2);

			// Encrypt with key1, should fail to decrypt with key2
			const { ciphertext, iv } = await encrypt('test', key1);
			await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
		});

		it('should derive different keys from different passwords', async () => {
			const salt = generateSalt();

			const key1 = await deriveKey('password1', salt);
			const key2 = await deriveKey('password2', salt);

			const { ciphertext, iv } = await encrypt('test', key1);
			await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
		});

		it('should handle very long passwords', async () => {
			const longPassword = 'A'.repeat(10000);
			const salt = generateSalt();

			const key = await deriveKey(longPassword, salt);
			const { ciphertext, iv } = await encrypt('test message', key);
			const decrypted = await decrypt(ciphertext, iv, key);

			expect(decrypted).toBe('test message');
		});

		it('should handle passwords with special characters', async () => {
			const specialPassword = '🔐Password!@#$%^&*()_+-=[]{}|;:,.<>?`~';
			const salt = generateSalt();

			const key = await deriveKey(specialPassword, salt);
			const { ciphertext, iv } = await encrypt('test', key);
			const decrypted = await decrypt(ciphertext, iv, key);

			expect(decrypted).toBe('test');
		});

		it('should handle empty password', async () => {
			const emptyPassword = '';
			const salt = generateSalt();

			// Should still work (though not recommended for real use)
			const key = await deriveKey(emptyPassword, salt);
			const { ciphertext, iv } = await encrypt('test', key);
			const decrypted = await decrypt(ciphertext, iv, key);

			expect(decrypted).toBe('test');
		});

		it('should handle unicode passwords', async () => {
			const unicodePassword = 'пароль密码パスワード🔑';
			const salt = generateSalt();

			const key = await deriveKey(unicodePassword, salt);
			const { ciphertext, iv } = await encrypt('test', key);
			const decrypted = await decrypt(ciphertext, iv, key);

			expect(decrypted).toBe('test');
		});
	});

	describe('Base64 Encoding Edge Cases', () => {
		it('should handle all byte values', () => {
			const allBytes = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				allBytes[i] = i;
			}

			const encoded = bufferToBase64(allBytes);
			const decoded = base64ToBuffer(encoded);

			expect(decoded.length).toBe(256);
			for (let i = 0; i < 256; i++) {
				expect(decoded[i]).toBe(i);
			}
		});

		it('should handle buffers of various lengths (padding test)', () => {
			for (let len = 0; len <= 10; len++) {
				const buffer = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
					buffer[i] = i;
				}

				const encoded = bufferToBase64(buffer);
				const decoded = base64ToBuffer(encoded);

				expect(decoded.length).toBe(len);
				for (let i = 0; i < len; i++) {
					expect(decoded[i]).toBe(i);
				}
			}
		});
	});

	describe('Concurrent Operations', () => {
		it('should handle concurrent encryptions', async () => {
			const messages = Array.from({ length: 10 }, (_, i) => `Message ${i}`);

			const results = await Promise.all(
				messages.map(async (msg) => {
					const { ciphertext, iv } = await encrypt(msg, testKey);
					const decrypted = await decrypt(ciphertext, iv, testKey);
					return { original: msg, decrypted };
				})
			);

			for (const { original, decrypted } of results) {
				expect(decrypted).toBe(original);
			}
		});

		it('should handle concurrent key derivations', async () => {
			const passwords = Array.from({ length: 5 }, (_, i) => `password${i}`);
			const salt = generateSalt();

			const keys = await Promise.all(passwords.map((p) => deriveKey(p, salt)));

			// Each key should be able to encrypt/decrypt
			for (const key of keys) {
				const { ciphertext, iv } = await encrypt('test', key);
				const decrypted = await decrypt(ciphertext, iv, key);
				expect(decrypted).toBe('test');
			}
		});
	});
});
