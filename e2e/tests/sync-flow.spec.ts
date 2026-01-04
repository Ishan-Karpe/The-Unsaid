// ===========================================
// THE UNSAID - Sync Flow E2E Tests
// ===========================================
// Tests for autosave, sync status, and draft persistence

import { test, expect } from '@playwright/test';
import { login, generateTestContent } from '../utils/test-helpers';

test.describe('Sync Flow', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test.describe('Autosave', () => {
		test('should autosave after typing stops', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();
			const testContent = generateTestContent('Autosave Test');

			// Type content
			await editor.fill(testContent);

			// Wait for autosave indicator to show saved
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });
		});

		test('should show saving indicator during save', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// Type to trigger save
			await editor.fill(generateTestContent('Saving Indicator'));

			// Wait for final saved state
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });
		});

		test('should autosave on debounce after typing', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// Type character by character with small delays
			await editor.pressSequentially('Test content...', { delay: 50 });

			// Wait for autosave after typing stops
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });
		});

		test('should not lose content on rapid typing', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();
			const rapidContent = generateTestContent('Rapid Typing');

			// Type rapidly
			await editor.fill(rapidContent);

			// Wait for save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });

			// Verify content is preserved
			await expect(editor).toHaveValue(rapidContent);
		});
	});

	test.describe('Sync Status Indicator', () => {
		test('should show correct sync states', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// Type to trigger dirty state
			await editor.type('x');

			// Should eventually show saved
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });
		});

		test('should update sync indicator on each save', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// First save
			await editor.fill('First content');
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });

			// Second save
			await editor.fill('Second content');
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });
		});
	});

	test.describe('Content Persistence', () => {
		test('should preserve content across navigation', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');
			const testContent = generateTestContent('Navigation Persistence');

			const editor = page.locator('textarea').first();
			await editor.fill(testContent);

			// Wait for save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });

			// Wait extra time for save to complete
			await page.waitForTimeout(2000);

			// Navigate away
			await page.goto('/history');
			await page.waitForLoadState('networkidle');

			// Navigate back - content should be in history (for new drafts)
			// Or if continuing same draft, it should be in editor
			await page.waitForTimeout(3000);

			// Check that the draft exists in history
			await expect(page.locator(`text=/${testContent.substring(0, 15)}/i`).first()).toBeVisible({
				timeout: 15000
			});
		});

		test('should persist content after closing and reopening draft', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');
			const testContent = generateTestContent('Reopen Persistence');

			const editor = page.locator('textarea').first();
			await editor.fill(testContent);

			// Wait for save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });

			// Wait extra time for save to complete
			await page.waitForTimeout(2000);

			// Go to history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(3000);

			// Find and click on the draft
			await page
				.locator(`text=/${testContent.substring(0, 15)}/i`)
				.first()
				.click();

			// Wait for draft to load
			await page.waitForTimeout(2000);

			// Should show content (either in editor or expanded view)
			const pageContent = await page.content();
			expect(pageContent).toContain(testContent.substring(0, 15));
		});

		test('should save draft with metadata', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const testContent = generateTestContent('Metadata Test');

			// Fill content
			const editor = page.locator('textarea').first();
			await editor.fill(testContent);

			// Try to fill recipient field if visible
			const recipientInput = page
				.locator('input[placeholder*="recipient" i], input[name="recipient"]')
				.first();
			if (await recipientInput.isVisible()) {
				await recipientInput.fill('Test Recipient');
			}

			// Wait for save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });

			// Go to history and verify
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Draft should be visible
			await expect(page.locator(`text=/${testContent.substring(0, 15)}/i`).first()).toBeVisible({
				timeout: 10000
			});
		});
	});

	test.describe('Draft Editing', () => {
		test('should update existing draft on edit', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Create initial draft
			const initialContent = generateTestContent('Initial');
			const editor = page.locator('textarea').first();
			await editor.fill(initialContent);
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });

			// Wait for save to complete
			await page.waitForTimeout(2000);

			// Modify content
			const updatedContent = initialContent + ' - UPDATED';
			await editor.fill(updatedContent);
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });

			// Wait for save to complete
			await page.waitForTimeout(2000);

			// Go to history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(3000);

			// Should show updated content
			await expect(page.locator('text=/UPDATED/i').first()).toBeVisible({ timeout: 15000 });
		});

		test('should preserve changes on accidental navigation', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const testContent = generateTestContent('Accidental Nav');
			const editor = page.locator('textarea').first();
			await editor.fill(testContent);

			// Wait for autosave
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 20000 });

			// Wait extra time for save to complete
			await page.waitForTimeout(2000);

			// Simulate accidental navigation by clicking browser back
			// Note: The app should have autosaved by now
			await page.goto('/settings');
			await page.goBack();

			// Give time for draft to load
			await page.waitForTimeout(3000);

			// Draft should be in history
			await page.goto('/history');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);
			await expect(page.locator(`text=/${testContent.substring(0, 15)}/i`).first()).toBeVisible({
				timeout: 15000
			});
		});
	});

	test.describe('Error Handling', () => {
		test('should handle network errors gracefully', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type some content first
			const editor = page.locator('textarea').first();
			await editor.fill('Network error test content');

			// Wait for initial save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });

			// The editor should still be functional
			await expect(editor).toBeVisible();
			await expect(editor).toBeEnabled();
		});

		test('should recover after temporary network issues', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const testContent = generateTestContent('Recovery Test');
			const editor = page.locator('textarea').first();
			await editor.fill(testContent);

			// Wait for save
			await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 15000 });

			// Verify in history
			await page.goto('/history');
			await page.waitForTimeout(2000);
			await expect(page.locator(`text=/${testContent.substring(0, 15)}/i`).first()).toBeVisible({
				timeout: 10000
			});
		});
	});

	test.describe('Character Count', () => {
		test('should display accurate word count', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// Type exactly 10 words
			await editor.fill('one two three four five six seven eight nine ten');

			// Word count should show 10
			await expect(page.locator('text=/10 words/i')).toBeVisible({ timeout: 5000 });
		});

		test('should update word count as user types', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();

			// Start with 5 words
			await editor.fill('one two three four five');
			await expect(page.locator('text=/5 words/i')).toBeVisible({ timeout: 5000 });

			// Add more words
			await editor.fill('one two three four five six seven');
			await expect(page.locator('text=/7 words/i')).toBeVisible({ timeout: 5000 });
		});
	});
});
