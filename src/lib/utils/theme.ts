// ===========================================
// THE UNSAID - Theme Utility
// ===========================================
// Handles theme preference management with system mode support
// Syncs between localStorage and data-theme attribute
//
// USAGE:
// - Call applyTheme() on initial load and preference changes
// - Use getStoredTheme() to read current preference
// - Use setStoredTheme() to persist preference
//
// @module theme

import { browser } from '$app/environment';

/**
 * Theme mode options
 * - light: Always light theme
 * - dark: Always dark theme
 * - system: Follow OS preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/**
 * Get the stored theme preference from localStorage.
 *
 * @returns The stored theme mode, or 'system' if none set
 *
 * @example
 * const currentTheme = getStoredTheme();
 * console.log('Current theme:', currentTheme); // 'light' | 'dark' | 'system'
 */
export function getStoredTheme(): ThemeMode {
	if (!browser) return 'system';

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored;
	}
	return 'system';
}

/**
 * Store the theme preference in localStorage.
 *
 * @param mode - The theme mode to store
 *
 * @example
 * setStoredTheme('dark');
 * // User preference is now saved
 */
export function setStoredTheme(mode: ThemeMode): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, mode);
}

/**
 * Get the effective theme based on mode.
 * For 'system', checks the OS preference.
 *
 * @param mode - The theme mode preference
 * @returns The actual theme to apply ('light' or 'dark')
 *
 * @example
 * const effectiveTheme = getEffectiveTheme('system');
 * // Returns 'dark' if OS is in dark mode
 */
export function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
	if (!browser) return 'light';

	if (mode === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return mode;
}

/**
 * Apply the theme to the document.
 * Handles 'system' mode by checking OS preference.
 *
 * @param mode - The theme mode to apply
 *
 * @example
 * // Apply dark theme
 * applyTheme('dark');
 *
 * @example
 * // Follow system preference
 * applyTheme('system');
 */
export function applyTheme(mode: ThemeMode): void {
	if (!browser) return;

	const effectiveTheme = getEffectiveTheme(mode);
	document.documentElement.setAttribute('data-theme', effectiveTheme);
}

/**
 * Apply and store the theme preference.
 * Combines setStoredTheme and applyTheme for convenience.
 *
 * @param mode - The theme mode to set and apply
 *
 * @example
 * // Switch to dark mode and save preference
 * setAndApplyTheme('dark');
 */
export function setAndApplyTheme(mode: ThemeMode): void {
	setStoredTheme(mode);
	applyTheme(mode);
}

/**
 * Set up a listener for system theme changes.
 * Only relevant when mode is 'system'.
 *
 * @param callback - Function to call when system theme changes
 * @returns Cleanup function to remove the listener
 *
 * @example
 * const cleanup = listenToSystemTheme(() => {
 *   applyTheme(getStoredTheme());
 * });
 *
 * // Later, remove the listener
 * cleanup();
 */
export function listenToSystemTheme(callback: () => void): () => void {
	if (!browser) return () => {};

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const handler = () => callback();
	mediaQuery.addEventListener('change', handler);

	return () => mediaQuery.removeEventListener('change', handler);
}
