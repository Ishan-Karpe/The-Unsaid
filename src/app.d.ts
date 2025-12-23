// ===========================================
// THE UNSAID - App Type Definitions
// ===========================================
// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
