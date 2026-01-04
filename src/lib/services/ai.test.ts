// ===========================================
// THE UNSAID - AI Service Tests (Node)
// ===========================================
// Tests for AI service API calls, retry logic, and error handling
// Runs in Node environment (no Svelte runes)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { aiService } from './ai';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock environment variable
vi.mock('$env/static/public', () => ({
	PUBLIC_API_URL: 'https://api.test.com'
}));

describe('AI Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('getAssistance', () => {
		it('should make successful API call and return suggestions', async () => {
			const mockResponse = {
				options: [
					{ text: 'Suggestion 1', why: 'Reason 1' },
					{ text: 'Suggestion 2', why: 'Reason 2' }
				]
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await aiService.getAssistance(
				{
					mode: 'clarify',
					draft_text: 'Hello Mom',
					recipient: 'Mom',
					intent: 'express love'
				},
				'test-token'
			);

			expect(result.error).toBeNull();
			expect(result.data).toEqual({
				options: mockResponse.options,
				original_valid: true,
				mode: 'clarify'
			});

			// Verify fetch was called correctly
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.test.com/api/ai/clarify',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer test-token'
					},
					body: JSON.stringify({
						draft_text: 'Hello Mom',
						recipient: 'Mom',
						intent: 'express love'
					})
				})
			);
		});

		it('should use correct endpoint for each AI mode', async () => {
			const modes = ['clarify', 'alternatives', 'tone', 'expand', 'opening'] as const;

			for (const mode of modes) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ options: [{ text: 'test', why: 'reason' }] })
				});

				await aiService.getAssistance(
					{ mode, draft_text: 'test', recipient: 'test', intent: 'test' },
					'token'
				);

				expect(mockFetch).toHaveBeenLastCalledWith(
					`https://api.test.com/api/ai/${mode}`,
					expect.any(Object)
				);
			}
		});

		it('should return auth error for 401 response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () => Promise.resolve({ detail: 'Unauthorized' })
			});

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'invalid-token'
			);

			expect(result.data).toBeNull();
			expect(result.error).toBe('Please sign in to use AI features');
		});

		it('should return consent error for 403 response with consent message', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: () => Promise.resolve({ detail: 'AI consent not granted' })
			});

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			expect(result.data).toBeNull();
			expect(result.error).toBe('Please enable AI features in your settings');
		});

		it('should return rate limit error for 429 response', async () => {
			// First call returns 429, retries will also return 429
			mockFetch.mockResolvedValue({
				ok: false,
				status: 429,
				json: () => Promise.resolve({ detail: 'Rate limited' })
			});

			const resultPromise = aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			// Advance through retry delays (exponential backoff: 1s, 2s, 4s)
			await vi.advanceTimersByTimeAsync(10000);

			const result = await resultPromise;

			expect(result.data).toBeNull();
			expect(result.error).toBe('Too many requests. Please wait a moment and try again.');
		});

		it('should return validation error for 422 response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: () => Promise.resolve({ detail: 'Draft text too short' })
			});

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: '', recipient: 'test', intent: 'test' },
				'token'
			);

			expect(result.data).toBeNull();
			expect(result.error).toBe('Draft text too short');
		});

		it('should retry on server errors (5xx)', async () => {
			// First two calls fail with 500, third succeeds
			mockFetch
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					json: () => Promise.resolve({ detail: 'Server error' })
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 502,
					json: () => Promise.resolve({ detail: 'Bad gateway' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ options: [{ text: 'success', why: 'retried' }] })
				});

			const resultPromise = aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			// Advance through retry delays
			await vi.advanceTimersByTimeAsync(5000);

			const result = await resultPromise;

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(result.error).toBeNull();
			expect(result.data?.options).toEqual([{ text: 'success', why: 'retried' }]);
		});

		it('should return error after max retries exceeded', async () => {
			// All calls fail with 503
			mockFetch.mockResolvedValue({
				ok: false,
				status: 503,
				json: () => Promise.resolve({ detail: 'Service unavailable' })
			});

			const resultPromise = aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			// Advance through all retry delays
			await vi.advanceTimersByTimeAsync(10000);

			const result = await resultPromise;

			expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
			expect(result.data).toBeNull();
			expect(result.error).toBe('AI service is temporarily unavailable. Please try again.');
		});

		it('should handle network errors with retries', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const resultPromise = aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			// Advance through retry delays
			await vi.advanceTimersByTimeAsync(10000);

			const result = await resultPromise;

			expect(result.data).toBeNull();
			expect(result.error).toBe('Unable to connect to AI service. Check your internet connection.');
		});

		it('should handle request cancellation via AbortSignal', async () => {
			const abortController = new AbortController();

			// Abort before making request
			abortController.abort();

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token',
				abortController.signal
			);

			// Should return null for both data and error (cancelled, not an error)
			expect(result.data).toBeNull();
			expect(result.error).toBeNull();
		});

		it('should return error for invalid response format', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ invalid: 'response' }) // Missing options array
			});

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			expect(result.data).toBeNull();
			expect(result.error).toBe('Received invalid response from AI service');
		});

		it('should validate option format in response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						options: [{ text: 'valid' }] // Missing 'why' field
					})
			});

			const result = await aiService.getAssistance(
				{ mode: 'clarify', draft_text: 'test', recipient: 'test', intent: 'test' },
				'token'
			);

			expect(result.data).toBeNull();
			expect(result.error).toBe('Received invalid response from AI service');
		});
	});

	describe('healthCheck', () => {
		it('should return true when service is healthy', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });

			const result = await aiService.healthCheck();

			expect(result).toBe(true);
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.test.com/health',
				expect.objectContaining({
					signal: expect.any(AbortSignal)
				})
			);
		});

		it('should return false when service is unhealthy', async () => {
			mockFetch.mockResolvedValueOnce({ ok: false });

			const result = await aiService.healthCheck();

			expect(result).toBe(false);
		});

		it('should return false on network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const result = await aiService.healthCheck();

			expect(result).toBe(false);
		});
	});

	describe('getModeLabel', () => {
		it('should return correct label for each mode', () => {
			expect(aiService.getModeLabel('clarify')).toBe('Clarity suggestions');
			expect(aiService.getModeLabel('alternatives')).toBe('Alternative phrasings');
			expect(aiService.getModeLabel('tone')).toBe('Tone adjustments');
			expect(aiService.getModeLabel('expand')).toBe('Expanded draft');
			expect(aiService.getModeLabel('opening')).toBe('Opening suggestions');
		});
	});

	describe('getModeDescription', () => {
		it('should return correct description for each mode', () => {
			expect(aiService.getModeDescription('clarify')).toBe(
				'Simplify your message while preserving its meaning'
			);
			expect(aiService.getModeDescription('alternatives')).toBe(
				'Different ways to express the same sentiment'
			);
			expect(aiService.getModeDescription('tone')).toBe(
				'Adjust the emotional delivery of your message'
			);
			expect(aiService.getModeDescription('expand')).toBe('Expand your draft with more detail');
			expect(aiService.getModeDescription('opening')).toBe(
				'Suggestions for how to start your message'
			);
		});
	});
});
