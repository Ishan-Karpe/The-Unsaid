// ===========================================
// THE UNSAID - Supabase Client
// ===========================================
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create Supabase client for browser with cookie-based session storage
// This ensures session is shared with server-side auth checks
// Configure for longer session persistence (7 days refresh, 30 days absolute)
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		flowType: 'pkce'
	}
});

// Type-safe database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
