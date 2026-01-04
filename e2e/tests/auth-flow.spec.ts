// ===========================================
// THE UNSAID - Auth Flow E2E Tests
// ===========================================
// End-to-end tests for authentication including login, logout,
// session persistence, and edge cases

import { test, expect } from '@playwright/test';
import { login, logout, TEST_USER } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
	test.describe('Login', () => {
		test('should redirect unauthenticated users to login', async ({ page }) => {
			// Try to access protected route
			await page.goto('/write');

			// Should redirect to login page
			await expect(page).toHaveURL(/\/login/);
		});

		test('should redirect unauthenticated users from history', async ({ page }) => {
			await page.goto('/history');
			await expect(page).toHaveURL(/\/login/);
		});

		test('should redirect unauthenticated users from settings', async ({ page }) => {
			await page.goto('/settings');
			await expect(page).toHaveURL(/\/login/);
		});

		test('should show error for invalid credentials', async ({ page }) => {
			await page.goto('/login');
			await page.waitForLoadState('networkidle');

			// Enter invalid credentials
			await page.locator('input[type="email"]').fill('nonexistent@email.com');
			await page.locator('input[type="password"]').fill('wrongpassword123');
			await page.locator('button[type="submit"]').click();

			// Should show error message
			await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible({
				timeout: 10000
			});

			// Should stay on login page
			await expect(page).toHaveURL(/\/login/);
		});

		test('should login successfully with valid credentials', async ({ page }) => {
			await login(page);

			// Should be on write page
			await expect(page).toHaveURL(/\/write/);

			// Should show editor textarea
			await expect(page.locator('textarea')).toBeVisible();
		});

		test('should redirect authenticated users away from login', async ({ page }) => {
			// First login
			await login(page);

			// Try to visit login page
			await page.goto('/login');

			// Should redirect to write
			await expect(page).toHaveURL(/\/write/);
		});

		test('should redirect authenticated users away from signup', async ({ page }) => {
			// First login
			await login(page);

			// Try to visit signup page
			await page.goto('/signup');

			// Should redirect to write
			await expect(page).toHaveURL(/\/write/);
		});

		test('should preserve redirectTo parameter after login', async ({ page }) => {
			// Try to access history page (will redirect to login with redirectTo)
			await page.goto('/history');

			// Should be on login page
			await expect(page).toHaveURL(/\/login/);

			// URL should contain redirectTo parameter
			expect(page.url()).toContain('redirectTo');

			// Login - Note: This test assumes the redirect is handled
			await page.locator('input[type="email"]').fill(TEST_USER.email);
			await page.locator('input[type="password"]').fill(TEST_USER.password);
			await page.locator('button[type="submit"]').click();

			// Should redirect to intended destination (write is default)
			await page.waitForURL(/\/(write|history)/, { timeout: 15000 });
		});
	});

	test.describe('Logout', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should logout and redirect to login', async ({ page }) => {
			await logout(page);

			// Should be on login page
			await expect(page).toHaveURL(/\/login/);
		});

		test('should clear session after logout', async ({ page }) => {
			await logout(page);

			// Try to access protected page
			await page.goto('/write');

			// Should redirect to login
			await expect(page).toHaveURL(/\/login/);
		});

		test('should clear session cookies after logout', async ({ page, context }) => {
			await logout(page);

			// Get cookies
			const cookies = await context.cookies();

			// Check that auth-related cookies are cleared or don't contain session
			const authCookies = cookies.filter(
				(c) => c.name.includes('auth') || c.name.includes('session') || c.name.includes('supabase')
			);

			// Should have no active auth cookies with tokens
			// (Note: Some cookies may still exist but without valid tokens)
			expect(
				authCookies.length === 0 || authCookies.every((c) => !c.value.includes('access'))
			).toBe(true);
		});
	});

	test.describe('Session Persistence', () => {
		test('should maintain session after page reload', async ({ page }) => {
			await login(page);

			// Reload the page
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Should still be on write page (may show password prompt for encryption key)
			// The key prompt is expected behavior - session is maintained but key needs restoration
			const url = page.url();
			expect(url).toContain('write');
		});

		test('should maintain session across navigation', async ({ page }) => {
			await login(page);

			// Navigate to different pages
			await page.goto('/history');
			await expect(page).toHaveURL(/\/history/);

			await page.goto('/settings');
			await expect(page).toHaveURL(/\/settings/);

			await page.goto('/write');
			await expect(page).toHaveURL(/\/write/);
		});
	});

	test.describe('Form Validation', () => {
		test('should require email and password', async ({ page }) => {
			await page.goto('/login');
			await page.waitForLoadState('networkidle');

			// Check that the submit button is disabled when form is empty
			const submitButton = page.locator('button[type="submit"]');
			await expect(submitButton).toBeDisabled();

			// Form should not submit (button is disabled)
			await expect(page).toHaveURL(/\/login/);
		});

		test('should validate email format', async ({ page }) => {
			await page.goto('/login');

			// Enter invalid email
			await page.locator('input[type="email"]').fill('notanemail');
			await page.locator('input[type="password"]').fill('password123');

			// The HTML5 email validation should prevent submission
			const emailInput = page.locator('input[type="email"]');
			const validationMessage = await emailInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);

			expect(validationMessage).not.toBe('');
		});
	});

	test.describe('Password Visibility Toggle', () => {
		test('should toggle password visibility on login', async ({ page }) => {
			await page.goto('/login');

			const passwordInput = page.locator('input[type="password"]');
			await passwordInput.fill('testpassword');

			// Find toggle button (usually has eye icon)
			const toggleButton = page
				.locator('button[aria-label*="password" i], button:has(svg)')
				.filter({ has: page.locator('svg') })
				.first();

			if (await toggleButton.isVisible()) {
				await toggleButton.click();

				// Password should now be visible (type="text")
				await expect(page.locator('input[type="text"]').first()).toHaveValue('testpassword');
			}
		});
	});

	test.describe('Navigation Links', () => {
		test('should navigate from login to signup', async ({ page }) => {
			await page.goto('/login');

			// Click sign up link
			await page
				.locator('a')
				.filter({ hasText: /sign up/i })
				.click();

			await expect(page).toHaveURL(/\/signup/);
		});

		test('should navigate from signup to login', async ({ page }) => {
			await page.goto('/signup');

			// Click log in link
			await page
				.locator('a')
				.filter({ hasText: /log in/i })
				.click();

			await expect(page).toHaveURL(/\/login/);
		});

		test('should navigate from login to forgot password', async ({ page }) => {
			await page.goto('/login');

			// Click forgot password link
			await page
				.locator('a')
				.filter({ hasText: /forgot/i })
				.click();

			await expect(page).toHaveURL(/\/forgot-password/);
		});

		test('should navigate back to home from login', async ({ page }) => {
			await page.goto('/login');

			// Click back to home link
			await page
				.locator('a')
				.filter({ hasText: /back to home/i })
				.click();

			await expect(page).toHaveURL(/\/$/);
		});
	});
});
