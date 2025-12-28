// ===========================================
// THE UNSAID - E2E Test Helpers
// ===========================================
// Shared utilities for E2E tests including authentication,
// draft management, and encryption key handling

import { type Page, expect } from '@playwright/test';

// Test user credentials (configure in test environment)
// These should match a user created in your Supabase test environment
export const TEST_USER = {
	email: process.env.E2E_TEST_EMAIL || 'e2e-test@theunsaid.test',
	password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!SecureEnough'
};

/**
 * Log in with test credentials
 * Navigates to login page, fills credentials, and waits for redirect to /write
 */
export async function login(
	page: Page,
	email = TEST_USER.email,
	password = TEST_USER.password
): Promise<void> {
	await page.goto('/login');
	await page.waitForLoadState('networkidle');

	// Fill email input
	await page.locator('input[type="email"]').fill(email);

	// Fill password input
	await page.locator('input[type="password"]').fill(password);

	// Click submit button
	await page.locator('button[type="submit"]').click();

	// Wait for redirect to /write (successful login)
	await page.waitForURL('**/write', { timeout: 15000 });
}

/**
 * Sign up a new test user
 * Creates a new account and waits for redirect
 */
export async function signup(page: Page, email: string, password: string): Promise<void> {
	await page.goto('/signup');
	await page.waitForLoadState('networkidle');

	// Fill email
	await page.locator('input[type="email"]').fill(email);

	// Fill password fields (password and confirmation)
	const passwordInputs = page.locator('input[type="password"]');
	await passwordInputs.nth(0).fill(password);
	await passwordInputs.nth(1).fill(password); // Confirm password

	// Submit form
	await page.locator('button[type="submit"]').click();

	// Wait for redirect to write page
	await page.waitForURL('**/write', { timeout: 20000 });
}

/**
 * Log out the current user
 * Navigates to settings and clicks sign out
 */
export async function logout(page: Page): Promise<void> {
	await page.goto('/settings');
	await page.waitForLoadState('networkidle');

	// Find and click sign out button
	const signOutButton = page.locator('button').filter({ hasText: /sign out/i });
	await signOutButton.click();

	// Wait for redirect to login
	await page.waitForURL('**/login', { timeout: 10000 });
}

/**
 * Write a draft and wait for autosave
 * Fills the editor and waits for sync indicator to show "Saved"
 */
export async function writeDraft(page: Page, content: string, recipient?: string): Promise<void> {
	await page.goto('/write');
	await page.waitForLoadState('networkidle');

	// Fill content in the editor textarea
	const editor = page.locator('textarea').first();
	await editor.fill(content);

	// Fill recipient if provided
	if (recipient) {
		const recipientInput = page.locator(
			'input[placeholder*="recipient" i], input[name="recipient"], input[aria-label*="recipient" i]'
		);
		if (await recipientInput.first().isVisible()) {
			await recipientInput.first().fill(recipient);
		}
	}

	// Wait for autosave indicator to show saved state
	await expect(page.locator('text=/saved/i').first()).toBeVisible({ timeout: 15000 });
}

/**
 * Navigate to history and verify a draft exists with the given content
 */
export async function verifyDraftInHistory(page: Page, contentSnippet: string): Promise<void> {
	await page.goto('/history');
	await page.waitForLoadState('networkidle');

	// Wait for drafts to load (give time for decryption)
	await page.waitForTimeout(2000);

	// Verify content is visible - escape special regex characters
	const escapedSnippet = contentSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	await expect(page.locator(`text=/${escapedSnippet}/i`).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Check if the encryption key prompt is visible
 * This appears when session is restored without the encryption key
 */
export async function hasKeyPrompt(page: Page): Promise<boolean> {
	const prompt = page.locator('text=/enter.*password/i, text=/decrypt/i, text=/unlock/i');
	return await prompt.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Enter password to restore encryption key
 * Used when refreshing the page and key is lost from memory
 */
export async function enterPasswordForKey(page: Page, password: string): Promise<void> {
	// Find password input in the prompt modal/dialog
	const passwordInput = page.locator('input[type="password"]').first();
	await passwordInput.fill(password);

	// Click unlock/submit button
	const submitButton = page.locator(
		'button[type="submit"], button:has-text("Unlock"), button:has-text("Continue")'
	);
	await submitButton.first().click();

	// Wait for prompt to disappear
	await page.waitForTimeout(1500);
}

/**
 * Check if user is logged in by verifying navigation
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
	await page.goto('/write');
	await page.waitForLoadState('networkidle');

	// If redirected to login, user is not logged in
	return !page.url().includes('/login');
}

/**
 * Clear all drafts for a test user (cleanup utility)
 */
export async function clearDrafts(page: Page): Promise<void> {
	await page.goto('/history');
	await page.waitForLoadState('networkidle');

	// Look for delete all or trash button if available
	const deleteButton = page.locator('button').filter({ hasText: /delete|trash|clear/i });
	if (await deleteButton.first().isVisible()) {
		await deleteButton.first().click();

		// Confirm if there's a confirmation dialog
		const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i });
		if (await confirmButton.first().isVisible({ timeout: 1000 })) {
			await confirmButton.first().click();
		}
	}
}

/**
 * Generate a unique test content string
 * Useful for creating distinct drafts in tests
 */
export function generateTestContent(prefix: string = 'E2E Test'): string {
	return `${prefix} - ${Date.now()} - ${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for network to be idle with a custom timeout
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
	await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a screenshot with a descriptive name
 * Useful for debugging failed tests
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
	await page.screenshot({ path: `e2e/screenshots/${name}-${Date.now()}.png` });
}
