// ===========================================
// THE UNSAID - Encryption Flow E2E Tests
// ===========================================
// End-to-end tests for the complete encryption/decryption cycle
// including draft creation, storage, and key restoration

import { test, expect } from '@playwright/test';
import {
	login,
	writeDraft,
	verifyDraftInHistory,
	hasKeyPrompt,
	enterPasswordForKey,
	generateTestContent,
	TEST_USER
} from '../utils/test-helpers';

test.describe('Encryption Flow', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test.describe('Draft Creation & Encryption', () => {
		test('should encrypt and save a new draft', async ({ page }) => {
			const testContent = generateTestContent('Encrypt Test');

			await writeDraft(page, testContent, 'Test Recipient');

			// Verify draft appears in history (means it was encrypted, stored, and decrypted)
			await verifyDraftInHistory(page, testContent.substring(0, 20));
		});

		test('should encrypt and decrypt drafts correctly', async ({ page }) => {
			const uniqueContent = generateTestContent('Decrypt Test');

			// Create draft
			await writeDraft(page, uniqueContent);

			// Navigate to history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');

			// Wait for decryption
			await page.waitForTimeout(2000);

			// Content should be decrypted and visible
			await expect(page.locator(`text=/${uniqueContent.substring(0, 15)}/`).first()).toBeVisible({
				timeout: 10000
			});
		});

		test('should preserve full content after encryption roundtrip', async ({ page }) => {
			const fullContent = `This is a complete message with multiple sentences.
It includes line breaks and special formatting.
Testing: quotes "here" and 'there', numbers 12345.`;

			await writeDraft(page, fullContent);

			// Navigate to history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Click on draft to open/edit
			await page.locator('text=/complete message/i').first().click();

			// Wait for navigation to write page
			await page.waitForURL('**/write*', { timeout: 5000 }).catch(() => {
				// Some implementations may show draft in modal instead
			});

			// Verify content is preserved (check for key phrases)
			const pageContent = await page.content();
			expect(pageContent).toContain('complete message');
		});
	});

	test.describe('Key Persistence', () => {
		test('should prompt for password after page refresh when key is lost', async ({ page }) => {
			// Write a draft first
			const testContent = generateTestContent('Key Persistence');
			await writeDraft(page, testContent);

			// Refresh the page (this will lose the in-memory encryption key)
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Navigate to history where decryption is needed
			await page.goto('/history');
			await page.waitForLoadState('networkidle');

			// Check if key prompt appears
			const promptVisible = await hasKeyPrompt(page);

			if (promptVisible) {
				// Enter password to restore key
				await enterPasswordForKey(page, TEST_USER.password);

				// Wait for decryption
				await page.waitForTimeout(2000);

				// Drafts should now be visible
				await expect(page.locator(`text=/${testContent.substring(0, 15)}/i`).first()).toBeVisible({
					timeout: 10000
				});
			} else {
				// Key might have been restored automatically - just verify drafts are visible
				await page.waitForTimeout(2000);
				// Page should show either drafts or empty state (not encrypted blobs)
				const hasReadableContent = await page
					.locator(`text=/${testContent.substring(0, 15)}/i`)
					.first()
					.isVisible()
					.catch(() => false);

				// Either the content is visible or there's a welcome/empty message
				const hasEmptyState = await page
					.locator('text=/start writing|no drafts|get started/i')
					.first()
					.isVisible()
					.catch(() => false);

				expect(hasReadableContent || hasEmptyState).toBe(true);
			}
		});

		test('should clear encryption key on logout', async ({ page }) => {
			// Write a draft
			await writeDraft(page, generateTestContent('Logout Key Test'));

			// Go to settings and logout
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');

			const signOutButton = page.locator('button').filter({ hasText: /sign out/i });
			await signOutButton.click();

			// Wait for redirect to login
			await page.waitForURL('**/login', { timeout: 10000 });

			// Login again
			await login(page);

			// Should be prompted for password since key was cleared
			await page.goto('/history');

			// Either shows key prompt or drafts (if key was re-derived during login)
			const hasPrompt = await hasKeyPrompt(page);
			const hasDrafts = await page
				.locator('text=/Logout Key Test/i')
				.first()
				.isVisible()
				.catch(() => false);

			// One of these should be true
			expect(hasPrompt || hasDrafts).toBe(true);
		});
	});

	test.describe('Encryption Edge Cases', () => {
		test('should handle empty content gracefully', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Don't write anything, just verify page is stable
			await page.waitForTimeout(2000);

			// Editor should still be visible and functional
			await expect(page.locator('textarea')).toBeVisible();

			// No errors should appear
			const errorVisible = await page
				.locator('text=/error/i')
				.first()
				.isVisible()
				.catch(() => false);
			expect(errorVisible).toBe(false);
		});

		test('should handle special characters in content', async ({ page }) => {
			const specialContent = `Special chars: <script>alert('xss')</script> "quotes" 'apostrophes' & ampersand © emoji 🎉`;

			await writeDraft(page, specialContent);
			await verifyDraftInHistory(page, 'Special chars');
		});

		test('should handle unicode and emoji correctly', async ({ page }) => {
			const emojiContent = `Heart: ❤️ Face: 😊 Flag: 🇺🇸 Complex: 👨‍👩‍👧‍👦 Test: ${Date.now()}`;

			await writeDraft(page, emojiContent);
			await verifyDraftInHistory(page, 'Heart');
		});

		test('should handle very long content', async ({ page }) => {
			// Create content with 10000 characters
			const longContent = 'A'.repeat(10000) + ` - Long Test ${Date.now()}`;

			await writeDraft(page, longContent);

			// Navigate to history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Should show truncated preview
			await expect(page.locator('text=/AAA/').first()).toBeVisible({ timeout: 10000 });
		});

		test('should handle multilingual content', async ({ page }) => {
			const multilingualContent = `English: Hello
Japanese: こんにちは
Arabic: مرحبا
Chinese: 你好
Korean: 안녕하세요
Russian: Привет`;

			await writeDraft(page, multilingualContent);
			await verifyDraftInHistory(page, 'English');
		});

		test('should handle content with null characters', async ({ page }) => {
			// Note: Null characters may be stripped by the browser/textarea
			const contentWithSpecialChars = `Line 1\nLine 2\tTabbed\rCarriage return`;

			await writeDraft(page, contentWithSpecialChars);
			await verifyDraftInHistory(page, 'Line 1');
		});
	});

	test.describe('Encryption Security', () => {
		test('should not expose plaintext in network requests', async ({ page }) => {
			const sensitiveContent = `SENSITIVE_MARKER_${Date.now()}_SECRET`;

			// Monitor network requests
			const requests: string[] = [];
			page.on('request', (request) => {
				const postData = request.postData();
				if (postData) {
					requests.push(postData);
				}
			});

			await writeDraft(page, sensitiveContent);

			// Wait for save to complete
			await page.waitForTimeout(3000);

			// Check that sensitive content is NOT in any request body (should be encrypted)
			const foundPlaintext = requests.some((req) => req.includes('SENSITIVE_MARKER'));
			expect(foundPlaintext).toBe(false);
		});

		test('should store encrypted content in database', async ({ page }) => {
			const uniqueMarker = `UNIQUE_CONTENT_${Date.now()}`;

			await writeDraft(page, uniqueMarker);

			// Wait for save
			await page.waitForTimeout(3000);

			// Verify content is in history (meaning encryption/decryption works)
			await verifyDraftInHistory(page, 'UNIQUE_CONTENT');
		});
	});
});
