// ===========================================
// THE UNSAID - AI Store (Svelte 5 Runes)
// ===========================================
// Manages ephemeral state for AI interactions: loading, results, errors
// Following the same pattern as auth.svelte.ts and draft.svelte.ts

import type { AIMode, AIOption } from '$lib/types';
import { aiService } from '$lib/services/ai';
import { supabase } from '$lib/services/supabase';

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
// Reactive State (Module-level)
// ------------------------------------------
let status = $state<AIStatus>('idle');
let activeMode = $state<AIMode | null>(null);
let suggestions = $state<AIOption[]>([]);
let originalText = $state<string>('');
let originalValid = $state<boolean>(true);
let error = $state<string | null>(null);

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

	/**
	 * Request AI suggestions for a draft
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
			console.log('AI Store: Requesting suggestions...', { mode, draftText });
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
					recipient: recipient || 'someone special',
					intent: intent || 'express my feelings'
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
			}
		} catch (err) {
			// Don't update state if request was aborted
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}

			status = 'error';
			error = err instanceof Error ? err.message : 'Failed to get AI suggestions';
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
