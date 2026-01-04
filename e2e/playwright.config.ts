// ===========================================
// THE UNSAID - Playwright E2E Configuration
// ===========================================
// Configures Playwright for end-to-end testing across browsers
// Supports desktop Chrome, Firefox, Safari and mobile viewports

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Directory containing test files
	testDir: './tests',

	// Run tests in parallel for faster execution
	fullyParallel: true,

	// Fail CI if test.only is left in code
	forbidOnly: !!process.env.CI,

	// Retry failed tests - more retries for CI and WebKit
	retries: process.env.CI ? 2 : 1,

	// Limit workers in CI for stability
	workers: process.env.CI ? 1 : undefined,

	// HTML reporter for detailed test results
	reporter: [['html', { open: 'never' }], ['list']],

	// Global test settings
	use: {
		// Base URL for navigation
		baseURL: 'http://localhost:5173',

		// Capture trace on first retry for debugging
		trace: 'on-first-retry',

		// Take screenshots only on failure
		screenshot: 'only-on-failure',

		// Record video on first retry
		video: 'on-first-retry',

		// Default timeout for actions
		actionTimeout: 15000,

		// Default navigation timeout
		navigationTimeout: 30000
	},

	// Test timeout (increased for encryption/decryption operations)
	timeout: 60000,

	// Expect timeout
	expect: {
		timeout: 15000
	},

	// Browser projects for cross-browser testing
	projects: [
		// Desktop browsers
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				// WebKit needs more time for some operations
				actionTimeout: 20000
			}
		},

		// Mobile viewports for responsive testing
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: {
				...devices['iPhone 12'],
				actionTimeout: 20000
			}
		}
	],

	// Development server configuration
	webServer: {
		command: 'pnpm dev --mode e2e',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	}
});
