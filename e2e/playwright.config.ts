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

	// Retry failed tests in CI for flaky test handling
	retries: process.env.CI ? 2 : 0,

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
		actionTimeout: 10000,

		// Default navigation timeout
		navigationTimeout: 30000
	},

	// Test timeout
	timeout: 30000,

	// Expect timeout
	expect: {
		timeout: 10000
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
			use: { ...devices['Desktop Safari'] }
		},

		// Mobile viewports for responsive testing
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],

	// Development server configuration
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	}
});
