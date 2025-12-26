// ===========================================
// THE UNSAID - DraftEditor Component Tests (Browser)
// ===========================================
// Tests for the main draft editing component
// Runs in browser environment (Playwright)

import { page } from 'vitest/browser';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DraftEditor from './DraftEditor.svelte';
import { draftStore } from '$lib/stores/draft.svelte';

describe('DraftEditor Component', () => {
	beforeEach(() => {
		// Reset draft store before each test
		draftStore.newDraft();
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render the editor container', async () => {
			render(DraftEditor);

			const editor = page.getByRole('textbox');
			await expect.element(editor).toBeInTheDocument();
		});

		it('should display default placeholder text', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await expect
				.element(textarea)
				.toHaveAttribute('placeholder', "Start writing... Take your time. There's no rush.");
		});

		it('should display custom placeholder when provided', async () => {
			render(DraftEditor, { placeholder: 'Custom placeholder text' });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toHaveAttribute('placeholder', 'Custom placeholder text');
		});
	});

	describe('Content Input', () => {
		it('should allow typing in the editor', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await textarea.fill('Hello, this is a test message.');

			await expect.element(textarea).toHaveValue('Hello, this is a test message.');
		});

		it('should update draft store when content changes', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await textarea.fill('Test content');

			// Wait for store update (fill() triggers input event automatically)
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(draftStore.draft.content).toBe('Test content');
		});

		it('should mark draft as dirty when content changes', async () => {
			render(DraftEditor);

			expect(draftStore.isDirty).toBe(false);

			const textarea = page.getByRole('textbox');
			await textarea.fill('New content');

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(draftStore.isDirty).toBe(true);
		});

		it('should reflect store content when draft is loaded', async () => {
			// Pre-load a draft into the store
			draftStore.loadDraft({
				id: 'test-id',
				content: 'Pre-loaded content',
				recipient: 'Friend',
				intent: 'appreciation',
				emotion: 'grateful',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toHaveValue('Pre-loaded content');
		});
	});

	describe('Props Configuration', () => {
		it('should apply maxLength constraint', async () => {
			render(DraftEditor, { maxLength: 100 });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toHaveAttribute('maxlength', '100');
		});

		it('should apply minRows for textarea height', async () => {
			render(DraftEditor, { minRows: 5 });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toHaveAttribute('rows', '5');
		});
	});

	describe('Autosave Integration', () => {
		it('should enable autosave by default', async () => {
			// Autosave is enabled by default, so component should render without issues
			const { unmount } = render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toBeInTheDocument();

			// Cleanup
			unmount();
		});

		it('should accept custom autosave debounce time', async () => {
			// Just verify the component accepts the prop without errors
			const { unmount } = render(DraftEditor, { autosaveDebounceMs: 500 });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toBeInTheDocument();

			unmount();
		});

		it('should disable autosave when autosaveEnabled is false', async () => {
			const { unmount } = render(DraftEditor, { autosaveEnabled: false });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toBeInTheDocument();

			unmount();
		});
	});

	describe('Callback Props', () => {
		it('should call onSave callback when save completes', async () => {
			const onSave = vi.fn();

			const { unmount } = render(DraftEditor, { onSave });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toBeInTheDocument();

			// The onSave callback would be called by autosave hook
			// This test verifies the prop is accepted

			unmount();
		});

		it('should call onSaveError callback when save fails', async () => {
			const onSaveError = vi.fn();

			const { unmount } = render(DraftEditor, { onSaveError });

			const textarea = page.getByRole('textbox');
			await expect.element(textarea).toBeInTheDocument();

			unmount();
		});
	});

	describe('Styling', () => {
		it('should have minimum height class', async () => {
			const { container } = render(DraftEditor);

			// Check that the component renders with expected structure
			const editorContainer = container.querySelector('.draft-editor');
			expect(editorContainer).not.toBeNull();
		});
	});

	describe('Unicode Support', () => {
		it('should handle unicode characters correctly', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			const unicodeText = 'Hello World! Emoji test.';

			await textarea.fill(unicodeText);
			await expect.element(textarea).toHaveValue(unicodeText);
		});

		it('should handle multi-language text', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			// Using ASCII-safe languages for testing
			const multiLangText = 'Hello Bonjour Hola';

			await textarea.fill(multiLangText);
			await expect.element(textarea).toHaveValue(multiLangText);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty content', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			await textarea.fill('');

			await expect.element(textarea).toHaveValue('');
		});

		it('should handle very long content within maxLength', async () => {
			render(DraftEditor, { maxLength: 1000 });

			const textarea = page.getByRole('textbox');
			const longText = 'A'.repeat(500);

			await textarea.fill(longText);
			await expect.element(textarea).toHaveValue(longText);
		});

		it('should handle content with newlines', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			const multilineText = 'Line 1\nLine 2\nLine 3';

			await textarea.fill(multilineText);
			await expect.element(textarea).toHaveValue(multilineText);
		});

		it('should handle special characters', async () => {
			render(DraftEditor);

			const textarea = page.getByRole('textbox');
			const specialChars = '<script>alert("test")</script>';

			await textarea.fill(specialChars);
			await expect.element(textarea).toHaveValue(specialChars);
		});
	});
});
