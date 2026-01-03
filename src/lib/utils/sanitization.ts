// ===========================================
// THE UNSAID - Input Sanitization Utilities
// ===========================================
// Provides XSS prevention, input length limits, special character handling,
// and emoji support verification
//
// SECURITY NOTES:
// - Never trust user input
// - Always sanitize before storage or display
// - Use CSP headers as additional protection layer
//
// @module sanitization

/**
 * Maximum lengths for various input types
 */
export const INPUT_LIMITS = {
	/** Maximum draft content length */
	DRAFT_CONTENT: 50000,
	/** Maximum recipient name length */
	RECIPIENT: 100,
	/** Maximum intent description */
	INTENT: 200,
	/** Maximum prompt length */
	PROMPT: 5000,
	/** Maximum email length */
	EMAIL: 254,
	/** Maximum password length (for memory/DoS protection) */
	PASSWORD: 128,
	/** Maximum name length */
	NAME: 100,
	/** Maximum general text input */
	TEXT_SHORT: 255,
	/** Maximum medium text */
	TEXT_MEDIUM: 1000,
	/** Maximum long text */
	TEXT_LONG: 10000
} as const;

/**
 * Characters that are potentially dangerous in HTML context
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

/**
 * Escape HTML special characters to prevent XSS
 * Use when displaying user input in HTML context
 *
 * @param input - String to escape
 * @returns Escaped string safe for HTML display
 *
 * @example
 * const safe = escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(input: string): string {
	if (!input || typeof input !== 'string') return '';
	return input.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Remove HTML tags from a string
 * Useful for stripping potential XSS vectors
 *
 * @param input - String with potential HTML
 * @returns String with HTML tags removed
 */
export function stripHtml(input: string): string {
	if (!input || typeof input !== 'string') return '';
	return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize input for safe storage
 * Trims, limits length, and removes null bytes
 *
 * @param input - User input to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = INPUT_LIMITS.TEXT_SHORT): string {
	if (!input || typeof input !== 'string') return '';

	return (
		input
			// Remove null bytes (security vulnerability)
			.replace(/\0/g, '')
			// Normalize whitespace (but preserve single spaces)
			.replace(/[\r\n\t]/g, ' ')
			.replace(/\s+/g, ' ')
			// Trim leading/trailing whitespace
			.trim()
			// Limit length
			.slice(0, maxLength)
	);
}

/**
 * Sanitize email address
 * Validates format and normalizes
 *
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
	if (!email || typeof email !== 'string') return '';

	const sanitized = email.toLowerCase().trim().slice(0, INPUT_LIMITS.EMAIL);

	// Basic email format check
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Check if a string contains potentially dangerous patterns
 *
 * @param input - String to check
 * @returns True if potentially dangerous patterns found
 */
export function containsDangerousPatterns(input: string): boolean {
	if (!input) return false;

	const dangerousPatterns = [
		// Script injection
		/<script[\s\S]*?>/i,
		// Event handlers
		/on\w+\s*=/i,
		// JavaScript protocol
		/javascript:/i,
		// Data URLs
		/data:\s*text\/html/i,
		// Expression evaluation
		/expression\s*\(/i,
		// VBScript
		/vbscript:/i,
		// Base64 in src
		/src\s*=\s*["']?\s*data:/i
	];

	return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize JSON input
 * Parses and re-stringifies to ensure valid JSON structure
 *
 * @param input - JSON string to validate
 * @returns Parsed object or null if invalid
 */
export function sanitizeJson<T>(input: string): T | null {
	try {
		const parsed = JSON.parse(input);
		// Re-stringify and parse to ensure clean object
		return JSON.parse(JSON.stringify(parsed)) as T;
	} catch {
		return null;
	}
}

// ===========================================
// EMOJI SUPPORT
// ===========================================

/**
 * Regular expression to match emoji characters
 * Covers most common emoji ranges
 */
const EMOJI_REGEX =
	/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{1FA00}-\u{1FAFF}]/gu;

/**
 * Check if a string contains emoji
 *
 * @param input - String to check
 * @returns True if contains emoji
 */
export function containsEmoji(input: string): boolean {
	if (!input) return false;
	return EMOJI_REGEX.test(input);
}

/**
 * Count emojis in a string
 *
 * @param input - String to count emojis in
 * @returns Number of emoji characters
 */
export function countEmojis(input: string): number {
	if (!input) return 0;
	const matches = input.match(EMOJI_REGEX);
	return matches ? matches.length : 0;
}

/**
 * Remove emojis from a string
 *
 * @param input - String with potential emojis
 * @returns String with emojis removed
 */
export function stripEmojis(input: string): string {
	if (!input) return '';
	return input.replace(EMOJI_REGEX, '').trim();
}

/**
 * Get the visual length of a string (accounting for emoji width)
 * Emojis typically display as 2 characters width
 *
 * @param input - String to measure
 * @returns Visual character count
 */
export function getVisualLength(input: string): number {
	if (!input) return 0;
	const emojiCount = countEmojis(input);
	// Remove emojis, count remaining chars, add emoji count * 2
	const textLength = stripEmojis(input).length;
	return textLength + emojiCount * 2;
}

// ===========================================
// SPECIAL CHARACTER HANDLING
// ===========================================

/**
 * Normalize Unicode characters
 * Converts fancy quotes, dashes, etc. to ASCII equivalents
 *
 * @param input - String with potentially fancy characters
 * @returns Normalized string
 */
export function normalizeUnicode(input: string): string {
	if (!input) return '';

	return (
		input
			// Normalize to NFC form (canonical decomposition followed by composition)
			.normalize('NFC')
			// Smart quotes to regular quotes
			.replace(/[\u2018\u2019\u201A]/g, "'")
			.replace(/[\u201C\u201D\u201E]/g, '"')
			// Various dashes to regular hyphen
			.replace(/[\u2013\u2014\u2015]/g, '-')
			// Ellipsis to three dots
			.replace(/\u2026/g, '...')
			// Various spaces to regular space
			.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
	);
}

/**
 * Check if string contains only allowed characters
 *
 * @param input - String to check
 * @param pattern - Regex pattern for allowed characters (default: alphanumeric + common punctuation)
 * @returns True if all characters are allowed
 */
export function containsOnlyAllowed(
	input: string,
	pattern: RegExp = /^[a-zA-Z0-9\s.,!?'"()-]+$/
): boolean {
	if (!input) return true;
	return pattern.test(input);
}

/**
 * Remove control characters (except common whitespace)
 *
 * @param input - String to clean
 * @returns String with control characters removed
 */
export function removeControlCharacters(input: string): string {
	if (!input) return '';
	// Remove control characters except tab, newline, carriage return
	// eslint-disable-next-line no-control-regex
	return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ===========================================
// URL SANITIZATION
// ===========================================

/**
 * Sanitize a URL, ensuring it's safe for use
 * Only allows http, https, and relative URLs
 *
 * @param url - URL to sanitize
 * @returns Safe URL or empty string
 */
export function sanitizeUrl(url: string): string {
	if (!url || typeof url !== 'string') return '';

	const trimmed = url.trim();

	// Allow relative URLs
	if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
		return trimmed;
	}

	// Only allow http and https
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return parsed.href;
		}
	} catch {
		// Invalid URL
	}

	return '';
}
