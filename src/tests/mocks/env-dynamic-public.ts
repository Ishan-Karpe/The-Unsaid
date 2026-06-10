// Mock for $env/dynamic/public in Vitest tests
export const env = {
	PUBLIC_E2E: 'false',
	PUBLIC_E2E_EMAIL: '',
	PUBLIC_E2E_PASSWORD: '',
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
	PUBLIC_API_URL: 'http://localhost:8000',
	PUBLIC_APP_URL: 'http://localhost:5173'
};
