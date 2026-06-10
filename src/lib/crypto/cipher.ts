// ===========================================
// THE UNSAID - Encryption Layer (Client-Side)
// ===========================================
// Uses Web Crypto API for AES-256-GCM encryption
// Key is derived from user password using PBKDF2

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

/**
 * Current PBKDF2 iteration count (OWASP recommends >= 600,000 for SHA-256).
 *
 * Existing users may have keys derived with an older, lower count; their
 * per-user count lives in `user_salts.kdf_iterations` and is migrated to
 * the current value on login (see kdfMigrationService).
 */
export const CURRENT_PBKDF2_ITERATIONS = 600000;

/** Iteration count used before versioned KDF was introduced. */
export const LEGACY_PBKDF2_ITERATIONS = 100000;

/**
 * Generate a cryptographically secure salt
 */
export function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a cryptographically secure IV (Initialization Vector)
 */
export function generateIV(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive an encryption key from a password using PBKDF2
 *
 * @param iterations - PBKDF2 iteration count; pass the user's stored
 *   `kdf_iterations` for existing users, defaults to the current standard
 */
export async function deriveKey(
	password: string,
	salt: Uint8Array,
	iterations: number = CURRENT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits', 'deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt as BufferSource,
			iterations,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: ALGORITHM, length: KEY_LENGTH },
		false, // Not extractable for security
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param key - The CryptoKey to use for encryption
 * @param providedIv - Optional IV to use (generates new one if not provided)
 */
export async function encrypt(
	plaintext: string,
	key: CryptoKey,
	providedIv?: Uint8Array
): Promise<{ ciphertext: string; iv: string }> {
	const encoder = new TextEncoder();
	const iv = providedIv ?? generateIV();

	const encryptedBuffer = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv: iv as BufferSource },
		key,
		encoder.encode(plaintext)
	);

	return {
		ciphertext: bufferToBase64(encryptedBuffer),
		iv: bufferToBase64(iv)
	};
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export async function decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
	const decoder = new TextDecoder();

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv: base64ToBuffer(iv) as BufferSource },
		key,
		base64ToBuffer(ciphertext) as BufferSource
	);

	return decoder.decode(decryptedBuffer);
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
