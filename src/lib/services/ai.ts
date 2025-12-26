// ===========================================
// THE UNSAID - AI Service (Frontend Client)
// ===========================================
// Enhanced with robust error handling, retry logic, and request cancellation

import { PUBLIC_API_URL } from '$env/static/public';
import type { AIMode, AIRequest, AIResponse, AIOption } from '$lib/types';

// ------------------------------------------
// Constants
// ------------------------------------------
const AI_ENDPOINTS: Record<AIMode, string> = {
	clarify: '/api/ai/clarify',
	alternatives: '/api/ai/alternatives',
	tone: '/api/ai/tone',
	expand: '/api/ai/expand',
	opening: '/api/ai/opening'
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

// ------------------------------------------
// Error Types
// ------------------------------------------
export type AIErrorType =
	| 'network'
	| 'auth'
	| 'rate_limit'
	| 'consent'
	| 'validation'
	| 'server'
	| 'unknown';

export interface AIError {
	type: AIErrorType;
	message: string;
	retryable: boolean;
}

// ------------------------------------------
// Helper Functions
// ------------------------------------------

/**
 * Categorize errors for better UX messaging
 */
function categorizeError(status: number, detail?: string): AIError {
	switch (status) {
		case 401:
			return {
				type: 'auth',
				message: 'Please sign in to use AI features',
				retryable: false
			};
		case 403:
			if (detail?.includes('consent')) {
				return {
					type: 'consent',
					message: 'Please enable AI features in your settings',
					retryable: false
				};
			}
			return {
				type: 'auth',
				message: "You don't have permission to use this feature",
				retryable: false
			};
		case 429:
			return {
				type: 'rate_limit',
				message: 'Too many requests. Please wait a moment and try again.',
				retryable: true
			};
		case 422:
			return {
				type: 'validation',
				message: detail || 'Invalid request. Please check your input.',
				retryable: false
			};
		case 500:
		case 502:
		case 503:
		case 504:
			return {
				type: 'server',
				message: 'AI service is temporarily unavailable. Please try again.',
				retryable: true
			};
		default:
			return {
				type: 'unknown',
				message: detail || 'Something went wrong. Please try again.',
				retryable: true
			};
	}
}

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate AI response format
 */
function validateResponse(data: unknown): data is { options: AIOption[] } {
	if (!data || typeof data !== 'object') return false;
	const obj = data as Record<string, unknown>;
	if (!Array.isArray(obj.options)) return false;

	return obj.options.every(
		(opt: unknown) =>
			typeof opt === 'object' &&
			opt !== null &&
			typeof (opt as Record<string, unknown>).text === 'string' &&
			typeof (opt as Record<string, unknown>).why === 'string'
	);
}

// ------------------------------------------
// AI Service
// ------------------------------------------
export const aiService = {
	/**
	 * Get AI assistance for a draft with retry logic
	 * @param request - The AI request containing draft text and metadata
	 * @param authToken - Supabase JWT for authentication
	 * @param signal - Optional AbortSignal for cancellation
	 */
	async getAssistance(
		request: AIRequest,
		authToken: string,
		signal?: AbortSignal
	): Promise<{ data: AIResponse | null; error: string | null }> {
		const endpoint = AI_ENDPOINTS[request.mode];

		let lastError: AIError | null = null;
		let attempts = 0;

		while (attempts <= MAX_RETRIES) {
			// Check if request was cancelled
			if (signal?.aborted) {
				return { data: null, error: null };
			}

			try {
				// Create timeout controller
				const timeoutController = new AbortController();
				const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

				// Combine signals if external signal provided
				const fetchSignal = signal
					? AbortSignal.any([signal, timeoutController.signal])
					: timeoutController.signal;

				const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify({
						draft_text: request.draft_text,
						recipient: request.recipient,
						intent: request.intent
					}),
					signal: fetchSignal
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const aiError = categorizeError(response.status, errorData.detail);

					// Don't retry non-retryable errors
					if (!aiError.retryable) {
						return { data: null, error: aiError.message };
					}

					lastError = aiError;
					attempts++;

					if (attempts <= MAX_RETRIES) {
						// Exponential backoff
						await delay(RETRY_DELAY_MS * Math.pow(2, attempts - 1));
						continue;
					}

					return { data: null, error: aiError.message };
				}

				const data = await response.json();

				// Validate response format
				if (!validateResponse(data)) {
					return {
						data: null,
						error: 'Received invalid response from AI service'
					};
				}

				return {
					data: {
						options: data.options,
						original_valid: true,
						mode: request.mode
					},
					error: null
				};
			} catch (err) {
				// Handle abort
				if (err instanceof Error && err.name === 'AbortError') {
					if (signal?.aborted) {
						return { data: null, error: null };
					}
					// Timeout
					lastError = {
						type: 'network',
						message: 'Request timed out. Please try again.',
						retryable: true
					};
				} else {
					lastError = {
						type: 'network',
						message: 'Unable to connect to AI service. Check your internet connection.',
						retryable: true
					};
				}

				attempts++;

				if (attempts <= MAX_RETRIES) {
					await delay(RETRY_DELAY_MS * Math.pow(2, attempts - 1));
					continue;
				}
			}
		}

		return {
			data: null,
			error: lastError?.message || 'Failed to connect to AI service'
		};
	},

	/**
	 * Check if AI service is available
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/health`, {
				signal: AbortSignal.timeout(5000)
			});
			return response.ok;
		} catch {
			return false;
		}
	},

	/**
	 * Get human-readable label for AI mode
	 */
	getModeLabel(mode: AIMode): string {
		const labels: Record<AIMode, string> = {
			clarify: 'Clarity suggestions',
			alternatives: 'Alternative phrasings',
			tone: 'Tone adjustments',
			expand: 'Expansion questions',
			opening: 'Opening suggestions'
		};
		return labels[mode];
	},

	/**
	 * Get description for AI mode
	 */
	getModeDescription(mode: AIMode): string {
		const descriptions: Record<AIMode, string> = {
			clarify: 'Simplify your message while preserving its meaning',
			alternatives: 'Different ways to express the same sentiment',
			tone: 'Adjust the emotional delivery of your message',
			expand: 'Questions to help you go deeper',
			opening: 'Suggestions for how to start your message'
		};
		return descriptions[mode];
	}
};
