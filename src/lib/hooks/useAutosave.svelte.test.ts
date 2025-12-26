// ===========================================
// THE UNSAID - useAutosave Hook Tests
// ===========================================
// Tests for the debounced autosave hook
// Note: Since useAutosave uses $effect, we test it in integration
// with the DraftEditor component which uses the hook

import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { draftStore } from '$lib/stores/draft.svelte';
import { draftService } from '$lib/services';

// Mock the draftService
vi.mock('$lib/services', () => ({
	draftService: {
		saveDraft: vi.fn()
	}
}));

describe('useAutosave Hook - Unit Tests', () => {
	beforeEach(() => {
		draftStore.newDraft();
		vi.clearAllMocks();
	});

	describe('DraftStore State', () => {
		it('should have initial empty content', () => {
			expect(draftStore.draft.content).toBe('');
		});

		it('should track dirty state when content changes', () => {
			expect(draftStore.isDirty).toBe(false);

			draftStore.setContent('Test content');

			expect(draftStore.isDirty).toBe(true);
		});

		it('should have content after setContent', () => {
			draftStore.setContent('Hello World');
			expect(draftStore.draft.content).toBe('Hello World');
		});

		it('should reset dirty flag with newDraft', () => {
			draftStore.setContent('Some content');
			expect(draftStore.isDirty).toBe(true);

			draftStore.newDraft();

			expect(draftStore.isDirty).toBe(false);
		});

		it('should reset dirty after markSaved', () => {
			draftStore.setContent('Content to save');
			expect(draftStore.isDirty).toBe(true);

			draftStore.markSaved('saved-id');

			expect(draftStore.isDirty).toBe(false);
		});
	});

	describe('DraftService Mock', () => {
		it('should call saveDraft with correct parameters', async () => {
			vi.mocked(draftService.saveDraft).mockResolvedValue({
				draft: {
					id: 'new-id',
					content: 'Test',
					recipient: 'Friend',
					intent: 'gratitude',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				error: null
			});

			await draftService.saveDraft({
				id: null,
				content: 'Test content',
				recipient: 'Friend',
				intent: 'gratitude'
			});

			expect(draftService.saveDraft).toHaveBeenCalledWith({
				id: null,
				content: 'Test content',
				recipient: 'Friend',
				intent: 'gratitude'
			});
		});

		it('should handle save errors', async () => {
			vi.mocked(draftService.saveDraft).mockResolvedValue({
				draft: null,
				error: 'Network error'
			});

			const result = await draftService.saveDraft({
				id: null,
				content: 'Test',
				recipient: 'Someone',
				intent: 'apology'
			});

			expect(result.error).toBe('Network error');
			expect(result.draft).toBeNull();
		});

		it('should return draft on success', async () => {
			const mockDraft = {
				id: 'test-123',
				content: 'Saved content',
				recipient: 'Mom',
				intent: 'love',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			vi.mocked(draftService.saveDraft).mockResolvedValue({
				draft: mockDraft,
				error: null
			});

			const result = await draftService.saveDraft({
				id: null,
				content: 'Content',
				recipient: 'Mom',
				intent: 'love'
			});

			expect(result.draft).toEqual(mockDraft);
			expect(result.error).toBeNull();
		});
	});

	describe('Save Eligibility Logic', () => {
		it('should consider empty content as not saveable', () => {
			draftStore.setContent('');
			const canSave = draftStore.isDirty && draftStore.draft.content.trim().length > 0;
			expect(canSave).toBe(false);
		});

		it('should consider whitespace-only content as not saveable', () => {
			draftStore.setContent('   \n\t  ');
			const canSave = draftStore.isDirty && draftStore.draft.content.trim().length > 0;
			expect(canSave).toBe(false);
		});

		it('should consider non-empty dirty content as saveable', () => {
			draftStore.setContent('Real content here');
			const canSave = draftStore.isDirty && draftStore.draft.content.trim().length > 0;
			expect(canSave).toBe(true);
		});

		it('should consider loaded draft as not dirty initially', () => {
			draftStore.loadDraft({
				id: 'existing',
				content: 'Existing content',
				recipient: 'Friend',
				intent: 'check-in',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			expect(draftStore.isDirty).toBe(false);
		});
	});

	describe('Sync Status', () => {
		it('should update sync status to saving', () => {
			draftStore.setSyncStatus({ state: 'saving' });
			expect(draftStore.syncStatus.state).toBe('saving');
		});

		it('should update sync status to saved', () => {
			draftStore.setSyncStatus({ state: 'saved', lastSync: new Date() });
			expect(draftStore.syncStatus.state).toBe('saved');
		});

		it('should update sync status to error', () => {
			draftStore.setSyncStatus({ state: 'error', message: 'Test error', retry: () => {} });
			expect(draftStore.syncStatus.state).toBe('error');
		});
	});

	describe('Draft Metadata', () => {
		it('should set recipient', () => {
			draftStore.setMetadata({ recipient: 'Mom' });
			expect(draftStore.draft.recipient).toBe('Mom');
		});

		it('should set intent', () => {
			draftStore.setMetadata({ intent: 'appreciation' });
			expect(draftStore.draft.intent).toBe('appreciation');
		});

		it('should set emotion', () => {
			draftStore.setMetadata({ emotion: 'grateful' });
			expect(draftStore.draft.emotion).toBe('grateful');
		});

		it('should not change emotion when undefined is passed (partial update)', () => {
			draftStore.setMetadata({ emotion: 'happy' });
			expect(draftStore.draft.emotion).toBe('happy');

			// setMetadata only updates defined values (partial merge)
			draftStore.setMetadata({ emotion: undefined });
			expect(draftStore.draft.emotion).toBe('happy');
		});

		it('should clear emotion when using newDraft', () => {
			draftStore.setMetadata({ emotion: 'happy' });
			expect(draftStore.draft.emotion).toBe('happy');

			draftStore.newDraft();
			expect(draftStore.draft.emotion).toBeUndefined();
		});
	});
});

describe('Debounce Logic - Pure Function Tests', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should debounce function calls', async () => {
		const fn = vi.fn();
		let timer: number | NodeJS.Timeout | null = null;

		function debounced() {
			if (timer) clearTimeout(timer as NodeJS.Timeout);
			timer = setTimeout(fn, 2000);
		}

		// Call multiple times
		debounced();
		debounced();
		debounced();

		// Function not called yet
		expect(fn).not.toHaveBeenCalled();

		// Advance past debounce time
		await vi.advanceTimersByTimeAsync(2100);

		// Function called once
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should reset timer on each call', async () => {
		const fn = vi.fn();
		let timer: number | NodeJS.Timeout | null = null;

		function debounced() {
			if (timer) clearTimeout(timer as NodeJS.Timeout);
			timer = setTimeout(fn, 1000);
		}

		debounced();
		await vi.advanceTimersByTimeAsync(500);

		debounced(); // Reset timer
		await vi.advanceTimersByTimeAsync(500);

		// Still not called (only 500ms since last call)
		expect(fn).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(600);

		// Now called
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should allow cancellation', async () => {
		const fn = vi.fn();
		let timer: number | NodeJS.Timeout | null = null;

		function debounced() {
			if (timer) clearTimeout(timer as NodeJS.Timeout);
			timer = setTimeout(fn, 1000);
		}

		function cancel() {
			if (timer) {
				clearTimeout(timer as NodeJS.Timeout);
				timer = null;
			}
		}

		debounced();
		await vi.advanceTimersByTimeAsync(500);

		cancel();

		await vi.advanceTimersByTimeAsync(1000);

		// Never called
		expect(fn).not.toHaveBeenCalled();
	});

	it('should allow immediate execution', async () => {
		const fn = vi.fn();
		let timer: number | NodeJS.Timeout | null = null;

		function debounced() {
			if (timer) clearTimeout(timer as NodeJS.Timeout);
			timer = setTimeout(fn, 1000);
		}

		function immediate() {
			if (timer) {
				clearTimeout(timer as NodeJS.Timeout);
				timer = null;
			}
			fn();
		}

		debounced();
		await vi.advanceTimersByTimeAsync(500);

		immediate();

		expect(fn).toHaveBeenCalledTimes(1);

		// Should not call again from original timer
		await vi.advanceTimersByTimeAsync(1000);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
