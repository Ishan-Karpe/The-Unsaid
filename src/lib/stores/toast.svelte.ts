// ===========================================
// THE UNSAID - Toast Store (Svelte 5 Runes)
// ===========================================
// Manages ephemeral toast notifications with auto-dismiss
// Following the same pattern as auth.svelte.ts and draft.svelte.ts

import { SvelteMap } from 'svelte/reactivity';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
	closing?: boolean;
}

// ------------------------------------------
// Reactive State (Module-level)
// ------------------------------------------
let toasts = $state<Toast[]>([]);
let counter = 0;
const EXIT_ANIMATION_MS = 200;

// Store timeout IDs for cleanup
const timeoutIds = new SvelteMap<string, ReturnType<typeof setTimeout>>();

// ------------------------------------------
// Toast Store Export
// ------------------------------------------
export const toastStore = {
	/**
	 * Get current toasts
	 */
	get toasts() {
		return toasts;
	},

	/**
	 * Check if there are any toasts
	 */
	get hasToasts() {
		return toasts.length > 0;
	},

	/**
	 * Show a toast notification
	 * @param message - The message to display
	 * @param type - The type of toast (success, error, info, warning)
	 * @param duration - How long to show the toast in milliseconds (0 for persistent)
	 * @returns The toast ID for manual dismissal if needed
	 */
	show(message: string, type: ToastType = 'info', duration: number = 3000): string {
		const id = `toast-${++counter}-${Date.now()}`;
		const toast: Toast = { id, type, message, duration, closing: false };

		toasts = [...toasts, toast];

		// Auto-dismiss after duration (unless duration is 0)
		if (duration > 0) {
			const timeoutId = setTimeout(() => this.dismiss(id), duration);
			timeoutIds.set(id, timeoutId);
		}

		return id;
	},

	/**
	 * Shorthand methods for common toast types
	 */
	success(message: string, duration: number = 3000): string {
		return this.show(message, 'success', duration);
	},

	error(message: string, duration: number = 5000): string {
		// Errors stay a bit longer by default
		return this.show(message, 'error', duration);
	},

	info(message: string, duration: number = 3000): string {
		return this.show(message, 'info', duration);
	},

	warning(message: string, duration: number = 4000): string {
		return this.show(message, 'warning', duration);
	},

	/**
	 * Dismiss a specific toast by ID
	 * @param id - The toast ID to dismiss
	 */
	dismiss(id: string): void {
		const toast = toasts.find((t) => t.id === id);
		if (!toast || toast.closing) return;

		// Clear the timeout if it exists
		const timeoutId = timeoutIds.get(id);
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutIds.delete(id);
		}

		toasts = toasts.map((t) => (t.id === id ? { ...t, closing: true } : t));

		const removalId = setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
			timeoutIds.delete(id);
		}, EXIT_ANIMATION_MS);

		timeoutIds.set(id, removalId);
	},

	/**
	 * Dismiss all toasts
	 */
	dismissAll(): void {
		// Clear all timeouts
		timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
		timeoutIds.clear();

		toasts = [];
	},

	/**
	 * Reset store state (useful for testing)
	 */
	reset(): void {
		this.dismissAll();
		counter = 0;
	}
};
