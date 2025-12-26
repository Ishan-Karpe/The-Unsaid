// ===========================================
// THE UNSAID - AISuggestions Component Tests (Browser)
// ===========================================
// Tests for AISuggestions UI component rendering and interactions
// Runs in browser environment (uses Svelte 5 components)

import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AISuggestions from './AISuggestions.svelte';
import { aiStore } from '$lib/stores/ai.svelte';

// Mock the AI service
vi.mock('$lib/services/ai', () => ({
	aiService: {
		getAssistance: vi.fn(),
		getModeLabel: vi.fn((mode) => {
			const labels: Record<string, string> = {
				clarify: 'Clarity suggestions',
				alternatives: 'Alternative phrasings',
				tone: 'Tone adjustments',
				expand: 'Expansion questions',
				opening: 'Opening suggestions'
			};
			return labels[mode] || '';
		}),
		getModeDescription: vi.fn((mode) => {
			const descriptions: Record<string, string> = {
				clarify: 'Simplify your message while preserving its meaning',
				alternatives: 'Different ways to express the same sentiment',
				tone: 'Adjust the emotional delivery of your message',
				expand: 'Questions to help you go deeper',
				opening: 'Suggestions for how to start your message'
			};
			return descriptions[mode] || '';
		})
	}
}));

// Mock Supabase
vi.mock('$lib/services/supabase', () => ({
	supabase: {
		auth: {
			getSession: vi.fn()
		}
	}
}));

describe('AISuggestions Component', () => {
	beforeEach(() => {
		aiStore.reset();
		vi.clearAllMocks();
	});

	afterEach(() => {
		aiStore.reset();
	});

	describe('Visibility', () => {
		it('should not render when status is idle', () => {
			const { container } = render(AISuggestions);

			expect(container.querySelector('.ai-suggestions-container')).toBeNull();
		});

		it('should render when status is loading', () => {
			// Manually set loading state
			aiStore._setStatus('loading');
			aiStore._setActiveMode('clarify');

			const { container } = render(AISuggestions);

			expect(container.querySelector('.ai-suggestions-container')).not.toBeNull();
		});

		it('should render when status is success', () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test suggestion', why: 'Test reason' }]);

			const { container } = render(AISuggestions);

			expect(container.querySelector('.ai-suggestions-container')).not.toBeNull();
		});

		it('should render when status is error', () => {
			aiStore._setStatus('error');
			aiStore._setActiveMode('clarify');
			aiStore._setError('Test error');

			const { container } = render(AISuggestions);

			expect(container.querySelector('.ai-suggestions-container')).not.toBeNull();
		});
	});

	describe('Header', () => {
		it('should display correct mode label', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions);

			const label = page.getByText('Clarity suggestions');
			await expect.element(label).toBeInTheDocument();
		});

		it('should display mode description when not loading', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions);

			const description = page.getByText('Simplify your message while preserving its meaning');
			await expect.element(description).toBeInTheDocument();
		});

		it('should hide mode description when loading', async () => {
			aiStore._setStatus('loading');
			aiStore._setActiveMode('clarify');

			render(AISuggestions);

			const description = page.getByText('Simplify your message while preserving its meaning');
			await expect.element(description).not.toBeInTheDocument();
		});

		it('should have a dismiss button', async () => {
			aiStore._setStatus('loading');
			aiStore._setActiveMode('clarify');

			render(AISuggestions);

			const dismissButton = page.getByLabelText('Dismiss suggestions');
			await expect.element(dismissButton).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('should show loading spinner when loading', async () => {
			aiStore._setStatus('loading');
			aiStore._setActiveMode('clarify');

			render(AISuggestions);

			// Check for loading spinner or loading text
			const loadingText = page.getByText('Analyzing your words...');
			await expect.element(loadingText).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('should display error message', async () => {
			aiStore._setStatus('error');
			aiStore._setActiveMode('clarify');
			aiStore._setError('Rate limit exceeded');

			render(AISuggestions);

			const errorText = page.getByText('Rate limit exceeded');
			await expect.element(errorText).toBeInTheDocument();
		});

		it('should have dismiss button in error state', async () => {
			aiStore._setStatus('error');
			aiStore._setActiveMode('clarify');
			aiStore._setError('Test error');

			render(AISuggestions);

			// Find dismiss buttons (there are multiple)
			const dismissButtons = page.getByText('Dismiss');
			await expect.element(dismissButtons).toBeInTheDocument();
		});
	});

	describe('Suggestions List', () => {
		it('should display all suggestions', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([
				{ text: 'First suggestion', why: 'First reason' },
				{ text: 'Second suggestion', why: 'Second reason' },
				{ text: 'Third suggestion', why: 'Third reason' }
			]);

			render(AISuggestions);

			await expect.element(page.getByText('First suggestion')).toBeInTheDocument();
			await expect.element(page.getByText('Second suggestion')).toBeInTheDocument();
			await expect.element(page.getByText('Third suggestion')).toBeInTheDocument();
		});

		it('should display option numbers', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([
				{ text: 'First', why: 'Reason' },
				{ text: 'Second', why: 'Reason' }
			]);

			render(AISuggestions);

			await expect.element(page.getByText('Option 1')).toBeInTheDocument();
			await expect.element(page.getByText('Option 2')).toBeInTheDocument();
		});

		it('should display why explanations', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Suggestion text', why: 'Because this is clearer' }]);

			render(AISuggestions);

			await expect.element(page.getByText('Because this is clearer')).toBeInTheDocument();
		});

		it('should show original valid message when original is valid', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);
			aiStore._setOriginalValid(true);

			render(AISuggestions);

			await expect
				.element(page.getByText('Your original words are also valid'))
				.toBeInTheDocument();
		});

		it('should not show original valid message when original is not valid', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);
			aiStore._setOriginalValid(false);

			render(AISuggestions);

			await expect
				.element(page.getByText('Your original words are also valid'))
				.not.toBeInTheDocument();
		});
	});

	describe('Interactions', () => {
		it('should call onApply when clicking a suggestion', async () => {
			const onApply = vi.fn();

			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Apply this text', why: 'Reason' }]);

			render(AISuggestions, { onApply });

			const suggestion = page.getByText('Apply this text');
			const button = suggestion.element().closest('[role="button"]') as HTMLElement;
			await button?.click();

			expect(onApply).toHaveBeenCalledWith('Apply this text');
		});

		it('should call onDismiss when clicking dismiss button', async () => {
			const onDismiss = vi.fn();

			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions, { onDismiss });

			const dismissButton = page.getByLabelText('Dismiss suggestions');
			await dismissButton.click();

			expect(onDismiss).toHaveBeenCalled();
		});

		it('should reset store when applying suggestion', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions, { onApply: vi.fn() });

			const suggestion = page.getByText('Test');
			const button = suggestion.element().closest('[role="button"]') as HTMLElement;
			await button?.click();

			// Store should be reset after applying
			expect(aiStore.status).toBe('idle');
		});

		it('should reset store when dismissing', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions);

			const dismissButton = page.getByLabelText('Dismiss suggestions');
			await dismissButton.click();

			expect(aiStore.status).toBe('idle');
		});

		it('should show Keep Original button in footer', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Test', why: 'Why' }]);

			render(AISuggestions);

			await expect.element(page.getByText('Keep Original')).toBeInTheDocument();
		});

		it('should handle keyboard navigation (Enter to apply)', async () => {
			const onApply = vi.fn();

			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([{ text: 'Keyboard test', why: 'Reason' }]);

			render(AISuggestions, { onApply });

			const suggestion = page.getByText('Keyboard test');
			const button = suggestion.element().closest('[role="button"]') as HTMLElement;
			button?.focus();

			// Simulate Enter keydown
			const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
			button?.dispatchEvent(event);

			expect(onApply).toHaveBeenCalledWith('Keyboard test');
		});
	});

	describe('Empty State', () => {
		it('should show empty state when no suggestions', async () => {
			aiStore._setStatus('success');
			aiStore._setActiveMode('clarify');
			aiStore._setSuggestions([]);

			render(AISuggestions);

			await expect.element(page.getByText('No suggestions available')).toBeInTheDocument();
		});
	});

	describe('Custom Class', () => {
		it('should apply custom class to container', () => {
			aiStore._setStatus('loading');
			aiStore._setActiveMode('clarify');

			const { container } = render(AISuggestions, { class: 'custom-class' });

			expect(container.querySelector('.custom-class')).not.toBeNull();
		});
	});
});
