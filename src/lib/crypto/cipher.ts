// ===========================================
// THE UNSAID - Encryption Layer (Client-Side)
// ===========================================
// Uses Web Crypto API for AES-256-GCM encryption
// Key is derived from user password using PBKDF2

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;

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
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
			salt,
			iterations: PBKDF2_ITERATIONS,
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
 */
export async function encrypt(
	plaintext: string,
	key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
	const encoder = new TextEncoder();
	const iv = generateIV();

	const encryptedBuffer = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
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
		{ name: ALGORITHM, iv: base64ToBuffer(iv) },
		key,
		base64ToBuffer(ciphertext)
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
