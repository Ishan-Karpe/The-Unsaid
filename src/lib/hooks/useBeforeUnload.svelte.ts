// ===========================================
// THE UNSAID - Before Unload Hook (Svelte 5 Runes)
// ===========================================
// Warns users before leaving with unsaved changes

import { draftStore } from '$lib/stores/draft.svelte';

export interface BeforeUnloadOptions {
	/** Custom message (browsers often ignore this) */
	message?: string;
	/** Whether the hook is enabled */
	enabled?: boolean;
	/** Custom condition check (defaults to draftStore.isDirty) */
	shouldWarn?: () => boolean;
}

export function useBeforeUnload(options: BeforeUnloadOptions = {}) {
	const {
		message = 'You have unsaved changes. Are you sure you want to leave?',
		enabled = true,
		shouldWarn
	} = options;

	let isEnabled = $state(enabled);

	/**
	 * Check if we should warn about leaving
	 */
	function checkShouldWarn(): boolean {
		if (!isEnabled) return false;
		if (shouldWarn) return shouldWarn();
		return draftStore.isDirty;
	}

	/**
	 * Handle beforeunload event
	 */
	function handleBeforeUnload(event: BeforeUnloadEvent): string | undefined {
		if (checkShouldWarn()) {
			// Modern browsers require returnValue to be set
			event.preventDefault();
			event.returnValue = message;
			return message;
		}
		return undefined;
	}

	/**
	 * Setup effect to add/remove event listener
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	return {
		/** Whether the hook is enabled */
		get isEnabled() {
			return isEnabled;
		},

		/** Enable the warning */
		enable() {
			isEnabled = true;
		},

		/** Disable the warning */
		disable() {
			isEnabled = false;
		},

		/** Check if would warn on leave */
		wouldWarn(): boolean {
			return checkShouldWarn();
		}
	};
}
