// ===========================================
// THE UNSAID - AI Store Tests (Browser)
// ===========================================
// Tests for AI store state management
// Runs in browser environment (uses Svelte 5 runes)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { aiStore } from './ai.svelte';
import { aiService } from '$lib/services/ai';
import type { AuthError, Session, User, UserResponse } from '@supabase/supabase-js';
import type { AIMode } from '$lib/types';

// Mock the AI service
vi.mock('$lib/services/ai', () => ({
	aiService: {
		getAssistance: vi.fn(),
		getModeLabel: vi.fn((mode) => `${mode} label`),
		getModeDescription: vi.fn((mode) => `${mode} description`)
	}
}));

// Mock Supabase
vi.mock('$lib/services/supabase', () => ({
	supabase: {
		auth: {
			getUser: vi.fn(),
			getSession: vi.fn()
		}
	}
}));

import { supabase } from '$lib/services/supabase';

// Helper to create mock session response
function mockSessionResponse(
	token: string | null
): { data: { session: Session }; error: null } | { data: { session: null }; error: null } {
	if (!token) {
		return { data: { session: null }, error: null };
	}
	return {
		data: {
			session: {
				access_token: token,
				refresh_token: 'refresh-token',
				expires_in: 3600,
				expires_at: Math.floor(Date.now() / 1000) + 3600,
				token_type: 'bearer',
				user: {
					id: 'test-user-id',
					aud: 'authenticated',
					role: 'authenticated',
					email: 'test@example.com',
					email_confirmed_at: '2024-01-01T00:00:00Z',
					phone: '',
					confirmed_at: '2024-01-01T00:00:00Z',
					last_sign_in_at: '2024-01-01T00:00:00Z',
					app_metadata: {},
					user_metadata: {},
					identities: [],
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				}
			}
		},
		error: null
	};
}

// Helper to create mock user response
function mockUserResponse(hasUser: boolean): UserResponse {
	if (!hasUser) {
		return {
			data: { user: null },
			error: { name: 'AuthError', message: 'No user found' } as AuthError
		};
	}
	return {
		data: {
			user: {
				id: 'test-user-id',
				aud: 'authenticated',
				role: 'authenticated',
				email: 'test@example.com',
				email_confirmed_at: '2024-01-01T00:00:00Z',
				phone: '',
				confirmed_at: '2024-01-01T00:00:00Z',
				last_sign_in_at: '2024-01-01T00:00:00Z',
				app_metadata: {},
				user_metadata: {},
				identities: [],
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			} as User
		},
		error: null
	};
}

describe('AI Store', () => {
	beforeEach(() => {
		aiStore.reset();
		aiStore.clearCache(); // Clear cache to prevent test interference
		vi.clearAllMocks();
	});

	afterEach(() => {
		aiStore.reset();
	});

	describe('Initial State', () => {
		it('should have idle status initially', () => {
			expect(aiStore.status).toBe('idle');
		});

		it('should have no active mode initially', () => {
			expect(aiStore.activeMode).toBeNull();
		});

		it('should have empty suggestions initially', () => {
			expect(aiStore.suggestions).toEqual([]);
		});

		it('should have no error initially', () => {
			expect(aiStore.error).toBeNull();
		});

		it('should not be loading initially', () => {
			expect(aiStore.isLoading).toBe(false);
		});

		it('should have no suggestions initially', () => {
			expect(aiStore.hasSuggestions).toBe(false);
		});

		it('should have empty original text initially', () => {
			expect(aiStore.originalText).toBe('');
		});

		it('should have originalValid as true initially', () => {
			expect(aiStore.originalValid).toBe(true);
		});
	});

	describe('requestSuggestions', () => {
		it('should set loading state when requesting suggestions', async () => {
			// Mock user and session
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			// Mock AI service to resolve quickly after we check state
			type AIResolve = (value: {
				data: { options: { text: string; why: string }[]; original_valid: boolean; mode: AIMode };
				error: null;
			}) => void;
			let resolveAI: AIResolve;
			vi.mocked(aiService.getAssistance).mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveAI = resolve;
					})
			);

			// Start request (don't await)
			const promise = aiStore.requestSuggestions('clarify', 'test content', 'Mom', 'express love');

			// Wait a tick for async state to update
			await new Promise((r) => setTimeout(r, 10));

			// Check loading state
			expect(aiStore.status).toBe('loading');
			expect(aiStore.activeMode).toBe('clarify');
			expect(aiStore.isLoading).toBe(true);
			expect(aiStore.originalText).toBe('test content');

			// Resolve the promise to allow cleanup
			resolveAI!({
				data: { options: [], original_valid: true, mode: 'clarify' },
				error: null
			});

			await promise;
		});

		it('should set success state with suggestions on successful response', async () => {
			const mockSuggestions = [
				{ text: 'Suggestion 1', why: 'Reason 1' },
				{ text: 'Suggestion 2', why: 'Reason 2' }
			];

			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: {
					options: mockSuggestions,
					original_valid: true,
					mode: 'clarify'
				},
				error: null
			});

			await aiStore.requestSuggestions('clarify', 'test content', 'Mom', 'express love');

			expect(aiStore.status).toBe('success');
			expect(aiStore.suggestions).toEqual(mockSuggestions);
			expect(aiStore.hasSuggestions).toBe(true);
			expect(aiStore.originalValid).toBe(true);
			expect(aiStore.error).toBeNull();
		});

		it('should set error state on auth failure', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(false));

			await aiStore.requestSuggestions('clarify', 'test content', 'Mom', 'express love');

			expect(aiStore.status).toBe('error');
			expect(aiStore.error).toBe('Please sign in to use AI features');
			expect(aiStore.suggestions).toEqual([]);
		});

		it('should set error state on API error', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: null,
				error: 'Rate limit exceeded'
			});

			await aiStore.requestSuggestions('clarify', 'test content', 'Mom', 'express love');

			expect(aiStore.status).toBe('error');
			expect(aiStore.error).toBe('Rate limit exceeded');
			expect(aiStore.suggestions).toEqual([]);
		});

		it('should use default values for empty recipient and intent', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: { options: [], original_valid: true, mode: 'clarify' },
				error: null
			});

			await aiStore.requestSuggestions('clarify', 'test content', '', '');

			expect(aiService.getAssistance).toHaveBeenCalledWith(
				expect.objectContaining({
					recipient: 'someone special',
					intent: 'express my feelings'
				}),
				'test-token'
			);
		});

		it('should cancel previous request when making new one', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			type AIResponse = {
				data: { options: { text: string; why: string }[]; original_valid: boolean; mode: AIMode };
				error: null;
			};
			let resolveFirst: (value: AIResponse) => void;
			const firstPromise = new Promise<AIResponse>((resolve) => {
				resolveFirst = resolve;
			});

			vi.mocked(aiService.getAssistance)
				.mockImplementationOnce(() => firstPromise)
				.mockResolvedValueOnce({
					data: { options: [{ text: 'Second', why: 'why' }], original_valid: true, mode: 'tone' },
					error: null
				});

			// Start first request
			const first = aiStore.requestSuggestions('clarify', 'first', 'A', 'B');

			// Start second request (should cancel first)
			const second = aiStore.requestSuggestions('tone', 'second', 'C', 'D');

			// Resolve first after second started
			resolveFirst!({
				data: { options: [{ text: 'First', why: 'why' }], original_valid: true, mode: 'clarify' },
				error: null
			});

			await Promise.all([first, second]);

			// Should have second request's results
			expect(aiStore.activeMode).toBe('tone');
		});
	});

	describe('dismissSuggestions', () => {
		it('should reset state to idle', async () => {
			// Set up some state first
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: {
					options: [{ text: 'Test', why: 'why' }],
					original_valid: true,
					mode: 'clarify'
				},
				error: null
			});

			await aiStore.requestSuggestions('clarify', 'test', 'Mom', 'love');

			expect(aiStore.hasSuggestions).toBe(true);

			// Dismiss
			aiStore.dismissSuggestions();

			expect(aiStore.status).toBe('idle');
			expect(aiStore.activeMode).toBeNull();
			expect(aiStore.suggestions).toEqual([]);
			expect(aiStore.originalText).toBe('');
			expect(aiStore.error).toBeNull();
		});
	});

	describe('setError', () => {
		it('should set error state', () => {
			aiStore.setError('Test error message');

			expect(aiStore.status).toBe('error');
			expect(aiStore.error).toBe('Test error message');
		});
	});

	describe('clearError', () => {
		it('should clear error and return to idle if no suggestions', () => {
			aiStore.setError('Test error');
			expect(aiStore.status).toBe('error');

			aiStore.clearError();

			expect(aiStore.error).toBeNull();
			expect(aiStore.status).toBe('idle');
		});

		it('should clear error and return to success if has suggestions', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: {
					options: [{ text: 'Test', why: 'why' }],
					original_valid: true,
					mode: 'clarify'
				},
				error: null
			});

			await aiStore.requestSuggestions('clarify', 'test', 'Mom', 'love');

			// Manually set error
			aiStore.setError('Temporary error');
			expect(aiStore.status).toBe('error');

			aiStore.clearError();

			expect(aiStore.error).toBeNull();
			expect(aiStore.status).toBe('success');
		});
	});

	describe('reset', () => {
		it('should reset all state to initial values', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: {
					options: [{ text: 'Test', why: 'why' }],
					original_valid: false,
					mode: 'tone'
				},
				error: null
			});

			await aiStore.requestSuggestions('tone', 'content', 'Dad', 'apology');

			// Reset
			aiStore.reset();

			expect(aiStore.status).toBe('idle');
			expect(aiStore.activeMode).toBeNull();
			expect(aiStore.suggestions).toEqual([]);
			expect(aiStore.originalText).toBe('');
			expect(aiStore.originalValid).toBe(true);
			expect(aiStore.error).toBeNull();
			expect(aiStore.isLoading).toBe(false);
			expect(aiStore.hasSuggestions).toBe(false);
		});
	});

	describe('Computed Properties', () => {
		it('isLoading should be true when status is loading', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			type AIResolve = (value: {
				data: { options: { text: string; why: string }[]; original_valid: boolean; mode: AIMode };
				error: null;
			}) => void;
			let resolveAI: AIResolve;
			vi.mocked(aiService.getAssistance).mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveAI = resolve;
					})
			);

			const promise = aiStore.requestSuggestions('clarify', 'test', 'Mom', 'love');

			// Wait a tick for async state to update
			await new Promise((r) => setTimeout(r, 10));

			expect(aiStore.isLoading).toBe(true);
			expect(aiStore.status).toBe('loading');

			// Resolve to clean up
			resolveAI!({
				data: { options: [], original_valid: true, mode: 'clarify' },
				error: null
			});

			await promise;
		});

		it('hasSuggestions should be true when suggestions exist', async () => {
			vi.mocked(supabase.auth.getUser).mockResolvedValue(mockUserResponse(true));
			vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse('test-token'));

			vi.mocked(aiService.getAssistance).mockResolvedValue({
				data: {
					options: [{ text: 'Test', why: 'why' }],
					original_valid: true,
					mode: 'clarify'
				},
				error: null
			});

			await aiStore.requestSuggestions('clarify', 'test', 'Mom', 'love');

			expect(aiStore.hasSuggestions).toBe(true);
			expect(aiStore.suggestions.length).toBe(1);
		});

		it('hasSuggestions should be false when suggestions empty', () => {
			expect(aiStore.hasSuggestions).toBe(false);
		});
	});
});
