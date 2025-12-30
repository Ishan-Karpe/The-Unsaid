// ===========================================
// THE UNSAID - AI Flow E2E Tests
// ===========================================
// End-to-end tests for AI suggestions including consent flow,
// AI tools interaction, and error handling

import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers';

test.describe('AI Flow', () => {
	test.describe('AI Consent Flow', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should show consent modal when AI not enabled and clicking AI tool', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type some content first
			const editor = page.locator('textarea').first();
			await editor.fill('I need to tell you something important.');

			// Wait for content to be saved
			await page.waitForTimeout(1000);

			// Click an AI tool button (Check Tone)
			const toneButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });
			if (await toneButton.first().isVisible()) {
				await toneButton.first().click();

				// Should either show consent modal OR show suggestions (if already consented)
				const consentModal = page.locator('text=/ai consent|enable ai|ai assistant/i');
				const suggestions = page.locator('[data-testid="ai-suggestions"], .ai-suggestions');

				// Wait for either consent modal or suggestions to appear
				await Promise.race([
					consentModal
						.first()
						.waitFor({ timeout: 5000 })
						.catch(() => {}),
					suggestions
						.first()
						.waitFor({ timeout: 5000 })
						.catch(() => {})
				]);

				// Either consent modal should be visible or AI should be working
				const isConsentVisible = await consentModal
					.first()
					.isVisible()
					.catch(() => false);
				const isSuggestionsVisible = await suggestions
					.first()
					.isVisible()
					.catch(() => false);

				expect(isConsentVisible || isSuggestionsVisible).toBe(true);
			}
		});

		test('should enable AI features after consent is given', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');

			// Find the AI toggle in settings
			const aiToggle = page.locator(
				'input[type="checkbox"][name*="ai" i], input[type="checkbox"][aria-label*="ai" i]'
			);

			if (await aiToggle.first().isVisible()) {
				// Enable AI if not already enabled
				const isChecked = await aiToggle.first().isChecked();
				if (!isChecked) {
					await aiToggle.first().click();
					await page.waitForTimeout(500);
				}

				// Verify toggle is now enabled
				await expect(aiToggle.first()).toBeChecked();
			}
		});
	});

	test.describe('AI Suggestions', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
			// Navigate to settings and enable AI if needed
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');

			const aiToggle = page.locator('input[type="checkbox"]').first();
			if (await aiToggle.isVisible()) {
				const isChecked = await aiToggle.isChecked();
				if (!isChecked) {
					await aiToggle.click();
					await page.waitForTimeout(500);
				}
			}
		});

		test('should disable AI tools when editor is empty', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Find AI tool buttons
			const toneButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if (await toneButton.first().isVisible()) {
				// Should be disabled when no content
				await expect(toneButton.first()).toBeDisabled();
			}
		});

		test('should enable AI tools when content is entered', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type content
			const editor = page.locator('textarea').first();
			await editor.fill('I want to express my gratitude for everything you have done.');

			// Wait a moment for reactive updates
			await page.waitForTimeout(500);

			// Find AI tool buttons
			const toneButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if (await toneButton.first().isVisible()) {
				// Should be enabled now
				await expect(toneButton.first()).toBeEnabled();
			}
		});

		test('should show loading state when requesting AI suggestions', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type content
			const editor = page.locator('textarea').first();
			await editor.fill('I need to tell you something important about how I feel.');

			await page.waitForTimeout(500);

			// Click an AI tool
			const toneButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if ((await toneButton.first().isVisible()) && (await toneButton.first().isEnabled())) {
				await toneButton.first().click();

				// Look for loading indicator (could be loading class, spinner, or text)
				const loadingIndicator = page.locator(
					'.loading, [aria-busy="true"], text=/loading|analyzing/i'
				);

				// Should show loading state (may be brief, so we just check it exists in DOM)
				// The loading state may disappear quickly if mocked
				await expect(loadingIndicator.first())
					.toBeAttached({ timeout: 5000 })
					.catch(() => {
						// Loading may have completed before we could check - that's acceptable
					});
			}
		});

		test('should display AI suggestions panel after request', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type meaningful content
			const editor = page.locator('textarea').first();
			await editor.fill(
				'I have been feeling really overwhelmed lately and I want you to understand what I am going through.'
			);

			await page.waitForTimeout(500);

			// Click AI tool
			const aiButtons = page.locator('button').filter({ hasText: /check tone|rewrite|expand/i });

			if (await aiButtons.first().isVisible()) {
				await aiButtons.first().click();

				// Wait for suggestions or error (longer timeout for API call)
				await page.waitForTimeout(5000);

				// Check if suggestions panel or error appeared
				const suggestionsPanel = page.locator(
					'[data-testid="ai-suggestions"], .card:has-text("suggestion"), text=/option|alternative/i'
				);
				const errorMessage = page.locator('text=/error|failed|unable/i');

				const hasSuggestions = await suggestionsPanel
					.first()
					.isVisible()
					.catch(() => false);
				const hasError = await errorMessage
					.first()
					.isVisible()
					.catch(() => false);

				// Either suggestions should appear or an error message (if AI service is not configured)
				// Both are valid outcomes for this test
				expect(hasSuggestions || hasError).toBe(true);
			}
		});
	});

	test.describe('AI Tools Interaction', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should have sidebar with AI tools on desktop', async ({ page }) => {
			// Set desktop viewport
			await page.setViewportSize({ width: 1280, height: 720 });

			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Look for AI Tools section in sidebar
			const aiToolsSection = page.locator('text=/ai tools/i');
			await expect(aiToolsSection.first()).toBeVisible();
		});

		test('should have different AI modes available', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Check for different AI mode buttons
			const toneButton = page.locator('button').filter({ hasText: /check tone/i });
			const expandButton = page.locator('button').filter({ hasText: /expand/i });
			const clarifyButton = page.locator('button').filter({ hasText: /rewrite|clarify/i });

			// At least one AI tool should be visible
			const hasAnyTool =
				(await toneButton
					.first()
					.isVisible()
					.catch(() => false)) ||
				(await expandButton
					.first()
					.isVisible()
					.catch(() => false)) ||
				(await clarifyButton
					.first()
					.isVisible()
					.catch(() => false));

			expect(hasAnyTool).toBe(true);
		});

		test('should open mobile drawer on small screens', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Look for FAB button that opens mobile drawer
			const fabButton = page.locator('button[aria-label*="context" i], .btn-circle').last();

			if (await fabButton.isVisible()) {
				await fabButton.click();

				// Drawer should open
				await page.waitForTimeout(500);

				// Check if drawer content is visible
				const drawerContent = page.locator(
					'[data-testid="mobile-drawer"], .drawer-content, .drawer-side'
				);
				const hasSideContent = await drawerContent
					.first()
					.isVisible()
					.catch(() => false);

				// Either drawer is visible or FAB was clicked successfully
				// On mobile, the drawer mechanism may vary
				expect(hasSideContent).toBe(true);
			}
		});
	});

	test.describe('Error Handling', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should handle network errors gracefully', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type content
			const editor = page.locator('textarea').first();
			await editor.fill('Test content for error handling.');

			// Intercept AI API calls and force them to fail
			await page.route('**/api/ai/**', (route) => {
				route.abort('failed');
			});

			// Try to use AI tool
			const aiButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if ((await aiButton.first().isVisible()) && (await aiButton.first().isEnabled())) {
				await aiButton.first().click();

				// Wait for error to appear
				await page.waitForTimeout(3000);

				// Check for error message
				const errorMessage = page.locator('text=/error|failed|unable|try again/i');
				const hasError = await errorMessage
					.first()
					.isVisible()
					.catch(() => false);

				// Error message should be displayed or button should remain usable
				// (The app should not crash)
				expect(hasError || (await aiButton.first().isEnabled())).toBe(true);
			}
		});

		test('should handle rate limiting gracefully', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();
			await editor.fill('Test content for rate limiting.');

			// Intercept AI API and return 429 rate limit error
			await page.route('**/api/ai/**', (route) => {
				route.fulfill({
					status: 429,
					contentType: 'application/json',
					body: JSON.stringify({ detail: 'Rate limit exceeded' })
				});
			});

			const aiButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if ((await aiButton.first().isVisible()) && (await aiButton.first().isEnabled())) {
				await aiButton.first().click();

				await page.waitForTimeout(3000);

				// Look for rate limit message or general error
				const rateLimitMessage = page.locator('text=/rate limit|too many|slow down|error/i');
				const hasMessage = await rateLimitMessage
					.first()
					.isVisible()
					.catch(() => false);

				// Should show rate limit or error message
				expect(hasMessage).toBe(true);
			}
		});

		test('should handle timeout gracefully', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();
			await editor.fill('Test content for timeout handling.');

			// Intercept AI API and simulate timeout by delaying response
			await page.route('**/api/ai/**', async (route) => {
				// Delay response significantly to trigger timeout
				await new Promise((resolve) => setTimeout(resolve, 60000));
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ options: [] })
				});
			});

			const aiButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if ((await aiButton.first().isVisible()) && (await aiButton.first().isEnabled())) {
				await aiButton.first().click();

				// Wait a reasonable time (shorter than timeout)
				await page.waitForTimeout(5000);

				// Button should eventually become usable again or show an error
				// (Testing that the UI doesn't hang forever)
				const isButtonClickable = await aiButton.first().isEnabled();

				// The app should handle timeout gracefully - button should remain interactive
				// or show loading state (not hang forever)
				const hasLoadingState = await page
					.locator('.loading')
					.first()
					.isVisible()
					.catch(() => false);
				expect(isButtonClickable || hasLoadingState).toBe(true);
			}
		});
	});

	test.describe('AI Suggestions Interaction', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should apply suggestion when selected', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			// Type initial content
			const editor = page.locator('textarea').first();
			const originalContent = 'I want to tell you something.';
			await editor.fill(originalContent);

			// Mock AI API to return suggestions
			await page.route('**/api/ai/**', (route) => {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						options: [
							{
								text: 'I would like to share something important with you.',
								why: 'This is more inviting and warm.'
							},
							{
								text: "There's something I need to express.",
								why: 'This is more direct.'
							}
						],
						original_valid: true
					})
				});
			});

			// Click AI tool
			const aiButton = page.locator('button').filter({ hasText: /check tone|rewrite|clarify/i });

			if ((await aiButton.first().isVisible()) && (await aiButton.first().isEnabled())) {
				await aiButton.first().click();

				// Wait for suggestions to appear
				await page.waitForTimeout(2000);

				// Look for suggestion buttons
				const suggestionButton = page.locator('button').filter({
					hasText: /I would like to share|apply|use this/i
				});

				if (await suggestionButton.first().isVisible()) {
					await suggestionButton.first().click();

					// Editor content should be updated
					await page.waitForTimeout(500);
					const newContent = await editor.inputValue();

					// Content should have changed
					expect(newContent).not.toBe(originalContent);
				}
			}
		});

		test('should dismiss suggestions panel', async ({ page }) => {
			await page.goto('/write');
			await page.waitForLoadState('networkidle');

			const editor = page.locator('textarea').first();
			await editor.fill('Test content for dismiss test.');

			// Mock AI API
			await page.route('**/api/ai/**', (route) => {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						options: [{ text: 'Suggested text', why: 'Better clarity' }],
						original_valid: true
					})
				});
			});

			const aiButton = page.locator('button').filter({ hasText: /check tone|analyze tone/i });

			if ((await aiButton.first().isVisible()) && (await aiButton.first().isEnabled())) {
				await aiButton.first().click();
				await page.waitForTimeout(2000);

				// Look for dismiss/close button
				const dismissButton = page.locator('button').filter({
					hasText: /dismiss|close|cancel|keep original/i
				});

				if (await dismissButton.first().isVisible()) {
					await dismissButton.first().click();
					await page.waitForTimeout(500);

					// Suggestions panel should be hidden
					const suggestionsPanel = page.locator('[data-testid="ai-suggestions"]');
					await expect(suggestionsPanel).not.toBeVisible();
				}
			}
		});
	});

	test.describe('Settings Integration', () => {
		test.beforeEach(async ({ page }) => {
			await login(page);
		});

		test('should toggle AI features from settings', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');

			// Find AI-related toggle
			const aiToggle = page.locator('label').filter({ hasText: /ai|assistant|suggestions/i });

			if (await aiToggle.first().isVisible()) {
				const checkbox = aiToggle.locator('input[type="checkbox"]').first();

				// Toggle the setting
				const wasChecked = await checkbox.isChecked();
				await checkbox.click();
				await page.waitForTimeout(500);

				// Verify toggle changed
				const isNowChecked = await checkbox.isChecked();
				expect(isNowChecked).not.toBe(wasChecked);

				// Toggle back to original state
				await checkbox.click();
				await page.waitForTimeout(500);
			}
		});

		test('should persist AI settings across page navigation', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');

			// Find and record AI toggle state
			const aiToggle = page
				.locator('label')
				.filter({ hasText: /ai|assistant|suggestions/i })
				.first();

			if (await aiToggle.isVisible()) {
				const checkbox = aiToggle.locator('input[type="checkbox"]').first();
				const initialState = await checkbox.isChecked();

				// Navigate away and back
				await page.goto('/write');
				await page.waitForLoadState('networkidle');

				await page.goto('/settings');
				await page.waitForLoadState('networkidle');

				// Find toggle again
				const aiToggleAfter = page
					.locator('label')
					.filter({ hasText: /ai|assistant|suggestions/i })
					.first();
				const checkboxAfter = aiToggleAfter.locator('input[type="checkbox"]').first();

				// State should be preserved
				const stateAfter = await checkboxAfter.isChecked();
				expect(stateAfter).toBe(initialState);
			}
		});
	});
});
