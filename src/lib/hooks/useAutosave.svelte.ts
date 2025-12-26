// ===========================================
// THE UNSAID - Autosave Hook (Svelte 5 Runes)
// ===========================================
// Debounced autosave with configurable callbacks
// Integrates with draftStore and draftService

import { untrack } from 'svelte';
import { draftStore } from '$lib/stores/draft.svelte';
import { draftService } from '$lib/services';

export interface AutosaveOptions {
	/** Debounce delay in milliseconds (default: 2000) */
	debounceMs?: number;
	/** Callback when save starts */
	onSaveStart?: () => void;
	/** Callback when save succeeds */
	onSaveSuccess?: (draftId: string) => void;
	/** Callback when save fails */
	onSaveError?: (error: string) => void;
}

export interface AutosaveState {
	/** Whether a save is currently in progress */
	isSaving: boolean;
	/** Whether a save is scheduled (debounce pending) */
	isPending: boolean;
	/** Last error message, if any */
	lastError: string | null;
}

export function useAutosave(options: AutosaveOptions = {}) {
	const { debounceMs = 2000, onSaveStart, onSaveSuccess, onSaveError } = options;

	// Internal reactive state
	let saveTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let isSaving = $state(false);
	let lastError = $state<string | null>(null);

	// Derived state for pending status
	let isPending = $derived(saveTimer !== null);

	/**
	 * Check if we can save (has content and is dirty)
	 */
	function canSave(): boolean {
		return draftStore.isDirty && draftStore.draft.content.trim().length > 0;
	}

	/**
	 * Cancel any pending autosave
	 */
	function cancelSave(): void {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
		}
	}

	/**
	 * Perform the actual save operation
	 */
	async function performSave(): Promise<void> {
		if (!canSave() || isSaving) return;

		isSaving = true;
		lastError = null;
		draftStore.setSyncStatus({ state: 'saving' });
		onSaveStart?.();

		try {
			const { draft, error } = await draftService.saveDraft({
				id: draftStore.draft.id,
				content: draftStore.draft.content,
				recipient: draftStore.draft.recipient,
				intent: draftStore.draft.intent,
				emotion: draftStore.draft.emotion
			});

			if (error) {
				lastError = error;
				draftStore.setSyncStatus({ state: 'error', message: error, retry: performSave });
				onSaveError?.(error);
			} else if (draft) {
				draftStore.markSaved(draft.id ?? undefined);
				onSaveSuccess?.(draft.id ?? '');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			lastError = errorMessage;
			draftStore.setSyncStatus({ state: 'error', message: errorMessage, retry: performSave });
			onSaveError?.(errorMessage);
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Schedule a debounced save
	 */
	function scheduleSave(): void {
		cancelSave();
		if (canSave()) {
			saveTimer = setTimeout(() => {
				saveTimer = null;
				performSave();
			}, debounceMs);
		}
	}

	/**
	 * Save immediately (bypasses debounce)
	 */
	async function saveNow(): Promise<void> {
		cancelSave();
		await performSave();
	}

	/**
	 * Setup effect to auto-schedule saves when draft becomes dirty
	 * Returns cleanup function to cancel pending saves
	 */
	$effect(() => {
		// Only track isDirty - use untrack for isSaving to avoid infinite loop
		const isDirty = draftStore.isDirty;
		const saving = untrack(() => isSaving);

		if (isDirty && !saving) {
			// Use untrack to prevent scheduleSave from causing effect re-runs
			untrack(() => scheduleSave());
		}

		// Cleanup: cancel pending save on unmount or re-run
		return () => {
			untrack(() => cancelSave());
		};
	});

	return {
		// State (use getters for reactivity)
		get isSaving() {
			return isSaving;
		},
		get isPending() {
			return isPending;
		},
		get lastError() {
			return lastError;
		},

		// Methods
		scheduleSave,
		cancelSave,
		saveNow,
		canSave
	};
}
