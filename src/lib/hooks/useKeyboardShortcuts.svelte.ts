// ===========================================
// THE UNSAID - Keyboard Shortcuts Hook (Svelte 5 Runes)
// ===========================================
// Configurable keyboard shortcuts with cleanup

export interface KeyboardShortcut {
	/** Key to listen for (e.g., 's', 'Enter', 'Escape') */
	key: string;
	/** Require Ctrl (Windows/Linux) or Cmd (Mac) */
	ctrlOrCmd?: boolean;
	/** Require Shift key */
	shift?: boolean;
	/** Require Alt/Option key */
	alt?: boolean;
	/** Handler function */
	handler: (event: KeyboardEvent) => void;
	/** Prevent default browser behavior */
	preventDefault?: boolean;
	/** Description for UI hints */
	description?: string;
}

export interface KeyboardShortcutsOptions {
	/** Array of shortcuts to register */
	shortcuts: KeyboardShortcut[];
	/** Whether shortcuts are enabled (default: true) */
	enabled?: boolean;
}

/**
 * Check if the user is on Mac
 */
function isMac(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Check if the shortcut matches the keyboard event
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
	// Check the key
	if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
		return false;
	}

	// Check Ctrl/Cmd modifier
	if (shortcut.ctrlOrCmd) {
		const hasModifier = isMac() ? event.metaKey : event.ctrlKey;
		if (!hasModifier) return false;
	}

	// Check Shift modifier
	if (shortcut.shift && !event.shiftKey) {
		return false;
	}

	// Check Alt modifier
	if (shortcut.alt && !event.altKey) {
		return false;
	}

	return true;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
	const { shortcuts, enabled = true } = options;

	let isEnabled = $state(enabled);

	/**
	 * Handle keydown events
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		if (!isEnabled) return;

		// Don't trigger shortcuts when typing in inputs (except for specific combos)
		const target = event.target as HTMLElement;
		const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT';

		for (const shortcut of shortcuts) {
			if (matchesShortcut(event, shortcut)) {
				// Allow Ctrl/Cmd shortcuts even in textarea (for save, etc.)
				if (isInput && !shortcut.ctrlOrCmd) {
					continue;
				}

				if (shortcut.preventDefault !== false) {
					event.preventDefault();
				}

				shortcut.handler(event);
				break;
			}
		}
	}

	/**
	 * Setup effect to add/remove event listeners
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	return {
		/** Whether shortcuts are currently enabled */
		get isEnabled() {
			return isEnabled;
		},

		/** Enable shortcuts */
		enable() {
			isEnabled = true;
		},

		/** Disable shortcuts */
		disable() {
			isEnabled = false;
		},

		/** Toggle shortcuts */
		toggle() {
			isEnabled = !isEnabled;
		},

		/** Get formatted shortcut hint (e.g., "Cmd+S" or "Ctrl+S") */
		getShortcutHint(shortcut: KeyboardShortcut): string {
			const parts: string[] = [];

			if (shortcut.ctrlOrCmd) {
				parts.push(isMac() ? 'Cmd' : 'Ctrl');
			}
			if (shortcut.alt) {
				parts.push(isMac() ? 'Option' : 'Alt');
			}
			if (shortcut.shift) {
				parts.push('Shift');
			}

			parts.push(shortcut.key.toUpperCase());

			return parts.join('+');
		}
	};
}

/**
 * Common shortcuts factory
 */
export const createCommonShortcuts = {
	save: (handler: () => void): KeyboardShortcut => ({
		key: 's',
		ctrlOrCmd: true,
		handler,
		preventDefault: true,
		description: 'Save draft'
	}),

	newDraft: (handler: () => void): KeyboardShortcut => ({
		key: 'n',
		ctrlOrCmd: true,
		handler,
		preventDefault: true,
		description: 'New draft'
	}),

	escape: (handler: () => void): KeyboardShortcut => ({
		key: 'Escape',
		handler,
		preventDefault: false,
		description: 'Close/Cancel'
	})
};
