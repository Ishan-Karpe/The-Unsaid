// ===========================================
// THE UNSAID - AI Store (Svelte 5 Runes)
// ===========================================
// Manages ephemeral state for AI interactions: loading, results, errors
// Includes session-level caching to avoid redundant API calls
// Following the same pattern as auth.svelte.ts and draft.svelte.ts

import type { AIMode, AIOption } from '$lib/types';
import { aiService } from '$lib/services/ai';
import { supabase } from '$lib/services/supabase';
import { SvelteMap } from 'svelte/reactivity';

// ------------------------------------------
// Types
// ------------------------------------------
export type AIStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AIState {
	status: AIStatus;
	activeMode: AIMode | null;
	suggestions: AIOption[];
	originalText: string;
	originalValid: boolean;
	error: string | null;
}

// ------------------------------------------
// Session Cache for AI Responses
// ------------------------------------------
// Key format: `${mode}:${hash(draftText)}`
// Caches responses to avoid redundant API calls when switching modes

interface CacheEntry {
	options: AIOption[];
	originalValid: boolean;
	timestamp: number;
}

interface LastRequest {
	mode: AIMode;
	draftText: string;
	recipient: string;
	intent: string;
}

const responseCache = new SvelteMap<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a simple hash for cache key
 * Uses a djb2-like algorithm for fast string hashing
 */
function hashText(text: string): string {
	let hash = 5381;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = ((hash << 5) + hash) ^ char; // hash * 33 ^ char
	}
	// Convert to positive number and then to base36 for shorter string
	return (hash >>> 0).toString(36);
}

/**
 * Build cache key from mode and text
 */
function buildCacheKey(mode: AIMode, draftText: string): string {
	return `${mode}:${hashText(draftText.trim())}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
	return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function sanitizeErrorMessage(message: string): string {
	return message.replace(/\s+/g, ' ').trim().slice(0, 200);
}

// ------------------------------------------
// Reactive State (Module-level)
// ------------------------------------------
let status = $state<AIStatus>('idle');
let activeMode = $state<AIMode | null>(null);
let suggestions = $state<AIOption[]>([]);
let originalText = $state<string>('');
let originalValid = $state<boolean>(true);
let error = $state<string | null>(null);
let lastRequest = $state<LastRequest | null>(null);

// AbortController for request cancellation
let abortController: AbortController | null = null;

// ------------------------------------------
// AI Store Export
// ------------------------------------------
export const aiStore = {
	// Getters
	get status() {
		return status;
	},
	get activeMode() {
		return activeMode;
	},
	get suggestions() {
		return suggestions;
	},
	get originalText() {
		return originalText;
	},
	get originalValid() {
		return originalValid;
	},
	get error() {
		return error;
	},
	get isLoading() {
		return status === 'loading';
	},
	get hasSuggestions() {
		return suggestions.length > 0;
	},
	get canRetry() {
		return lastRequest !== null;
	},

	/**
	 * Request AI suggestions for a draft
	 * Uses session-level caching to avoid redundant API calls
	 * @param mode - The AI mode (clarify, alternatives, tone, expand, opening)
	 * @param draftText - The draft content to analyze
	 * @param recipient - Who the message is for
	 * @param intent - What the user wants to express
	 */
	async requestSuggestions(
		mode: AIMode,
		draftText: string,
		recipient: string,
		intent: string
	): Promise<void> {
		const normalizedRecipient = recipient || 'someone special';
		const normalizedIntent = intent || 'express my feelings';

		lastRequest = {
			mode,
			draftText,
			recipient: normalizedRecipient,
			intent: normalizedIntent
		};

		// Check cache first
		const cacheKey = buildCacheKey(mode, draftText);
		const cached = responseCache.get(cacheKey);

		if (cached && isCacheValid(cached)) {
			// Use cached response - no API call needed
			status = 'success';
			activeMode = mode;
			originalText = draftText;
			suggestions = cached.options;
			originalValid = cached.originalValid;
			error = null;
			console.log('AI Store: Using cached response for', mode);
			return;
		}

		// Cancel any existing request
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		// Set loading state
		status = 'loading';
		activeMode = mode;
		originalText = draftText;
		error = null;
		suggestions = [];
		originalValid = true;

		try {
			console.log('AI Store: Requesting suggestions...', {
				mode,
				length: draftText.length
			});
			// Get auth token from Supabase (use getUser for security)
			const {
				data: { user },
				error: userError
			} = await supabase.auth.getUser();

			if (userError || !user) {
				throw new Error('Please sign in to use AI features');
			}

			// Get the session for the access token
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				throw new Error('Please sign in to use AI features');
			}

			const token = session.access_token;

			// Make the API request
			const result = await aiService.getAssistance(
				{
					mode,
					draft_text: draftText,
					recipient: normalizedRecipient,
					intent: normalizedIntent
				},
				token
			);

			// Check if request was aborted
			if (abortController?.signal.aborted) {
				return;
			}

			if (result.error) {
				throw new Error(result.error);
			}

			if (result.data) {
				status = 'success';
				suggestions = result.data.options;
				originalValid = result.data.original_valid;

				// Cache the response for future use
				responseCache.set(cacheKey, {
					options: result.data.options,
					originalValid: result.data.original_valid,
					timestamp: Date.now()
				});
				console.log('AI Store: Cached response for', mode);
			}
		} catch (err) {
			// Don't update state if request was aborted
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}

			status = 'error';
			error = err instanceof Error ? sanitizeErrorMessage(err.message) : 'Failed to get AI suggestions';
			suggestions = [];
		}
	},

	/**
	 * Clear suggestions and reset to idle state
	 */
	dismissSuggestions() {
		// Cancel any pending request
		if (abortController) {
			abortController.abort();
			abortController = null;
		}

		status = 'idle';
		activeMode = null;
		suggestions = [];
		originalText = '';
		originalValid = true;
		error = null;
		lastRequest = null;
	},

	/**
	 * Retry the last AI request (if available)
	 */
	async retryLastRequest(): Promise<void> {
		if (!lastRequest) return;
		await this.requestSuggestions(
			lastRequest.mode,
			lastRequest.draftText,
			lastRequest.recipient,
			lastRequest.intent
		);
	},

	/**
	 * Set error state
	 */
	setError(message: string) {
		status = 'error';
		error = message;
	},

	/**
	 * Clear error without resetting other state
	 */
	clearError() {
		error = null;
		if (status === 'error') {
			status = suggestions.length > 0 ? 'success' : 'idle';
		}
	},

	/**
	 * Reset all state to initial values
	 */
	reset() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}

		status = 'idle';
		activeMode = null;
		suggestions = [];
		originalText = '';
		originalValid = true;
		error = null;
		lastRequest = null;
	},

	/**
	 * Clear the response cache
	 * Call this on logout or when content changes significantly
	 */
	clearCache() {
		responseCache.clear();
		console.log('AI Store: Cache cleared');
	},

	/**
	 * Get cache stats for debugging
	 */
	getCacheStats() {
		return {
			size: responseCache.size,
			keys: Array.from(responseCache.keys())
		};
	},

	// Test helpers (prefixed with _ to indicate internal use)
	_setStatus(newStatus: AIStatus) {
		status = newStatus;
	},
	_setActiveMode(mode: AIMode | null) {
		activeMode = mode;
	},
	_setSuggestions(newSuggestions: AIOption[]) {
		suggestions = newSuggestions;
	},
	_setOriginalText(text: string) {
		originalText = text;
	},
	_setOriginalValid(valid: boolean) {
		originalValid = valid;
	},
	_setError(newError: string | null) {
		error = newError;
	}
};
