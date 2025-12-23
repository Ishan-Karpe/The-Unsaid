// ===========================================
// THE UNSAID - Supabase Client
// ===========================================
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create Supabase client for browser with cookie-based session storage
// This ensures session is shared with server-side auth checks
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Type-safe database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
