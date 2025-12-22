// ===========================================
// THE UNSAID - Supabase Client
// ===========================================
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create Supabase client for browser
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Type-safe database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
