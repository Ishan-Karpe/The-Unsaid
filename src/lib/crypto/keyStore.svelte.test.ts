// ===========================================
// THE UNSAID - Key Store Tests (Browser)
// ===========================================
// Tests for in-memory key storage
// Runs in browser environment (Web Crypto API required)

import { describe, it, expect, beforeEach } from 'vitest';
import { setKey, getKey, getSalt, hasKey, clearKey } from './keyStore';
import { generateSalt, deriveKey } from './cipher';

describe('Key Store Module', () => {
	beforeEach(() => {
		// Clear any existing keys before each test
		clearKey();
	});

	describe('initial state', () => {
		it('should have no key initially', () => {
			expect(hasKey()).toBe(false);
			expect(getKey()).toBeNull();
			expect(getSalt()).toBeNull();
		});
	});

	describe('setKey', () => {
		it('should store key and salt', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);

			setKey(key, salt);

			expect(hasKey()).toBe(true);
			expect(getKey()).toBe(key);
			expect(getSalt()).toBe(salt);
		});

		it('should overwrite existing key', async () => {
			const salt1 = generateSalt();
			const key1 = await deriveKey('password1', salt1);
			setKey(key1, salt1);

			const salt2 = generateSalt();
			const key2 = await deriveKey('password2', salt2);
			setKey(key2, salt2);

			expect(getKey()).toBe(key2);
			expect(getSalt()).toBe(salt2);
		});
	});

	describe('getKey', () => {
		it('should return null when no key set', () => {
			expect(getKey()).toBeNull();
		});

		it('should return the stored key', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			setKey(key, salt);

			const retrieved = getKey();

			expect(retrieved).toBe(key);
			expect(retrieved?.type).toBe('secret');
		});
	});

	describe('getSalt', () => {
		it('should return null when no salt set', () => {
			expect(getSalt()).toBeNull();
		});

		it('should return the stored salt', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			setKey(key, salt);

			const retrieved = getSalt();

			expect(retrieved).toBe(salt);
			expect(retrieved?.length).toBe(16);
		});
	});

	describe('hasKey', () => {
		it('should return false when no key set', () => {
			expect(hasKey()).toBe(false);
		});

		it('should return true when key is set', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			setKey(key, salt);

			expect(hasKey()).toBe(true);
		});
	});

	describe('clearKey', () => {
		it('should clear stored key and salt', async () => {
			const salt = generateSalt();
			const key = await deriveKey('password', salt);
			setKey(key, salt);

			expect(hasKey()).toBe(true);

			clearKey();

			expect(hasKey()).toBe(false);
			expect(getKey()).toBeNull();
			expect(getSalt()).toBeNull();
		});

		it('should be safe to call when no key exists', () => {
			expect(() => clearKey()).not.toThrow();
			expect(hasKey()).toBe(false);
		});

		it('should allow setting new key after clear', async () => {
			const salt1 = generateSalt();
			const key1 = await deriveKey('password1', salt1);
			setKey(key1, salt1);
			clearKey();

			const salt2 = generateSalt();
			const key2 = await deriveKey('password2', salt2);
			setKey(key2, salt2);

			expect(hasKey()).toBe(true);
			expect(getKey()).toBe(key2);
		});
	});
});
