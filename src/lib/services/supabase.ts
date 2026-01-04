// ===========================================
// THE UNSAID - Supabase Client
// ===========================================
import { createBrowserClient } from '@supabase/ssr';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY
} from '$env/static/public';
import { env } from '$env/dynamic/public';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
	clearCookie,
	isE2E,
	readStorage,
	removeStorage,
	setCookie,
	writeStorage
} from './e2eStorage';

type E2EUser = {
	id: string;
	email: string;
	created_at: string;
};

type E2ESession = {
	access_token: string;
	user: E2EUser;
	expires_at: number;
};

const E2E_COOKIE_NAME = 'e2e_user';
const E2E_USER_KEY = 'e2e_user_data';
const E2E_SESSION_KEY = 'e2e_session_data';

const DEFAULT_E2E_EMAIL = 'e2e-test@theunsaid.test';
const DEFAULT_E2E_PASSWORD = 'TestPassword123!SecureEnough';

// Use dynamic env for E2E credentials (optional, only set during E2E testing)
const allowedEmail = env.PUBLIC_E2E_EMAIL || DEFAULT_E2E_EMAIL;
const allowedPassword = env.PUBLIC_E2E_PASSWORD || DEFAULT_E2E_PASSWORD;

const authListeners = new Set<(event: string, session: E2ESession | null) => void>();

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i += 1) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function buildUser(email: string): E2EUser {
	const stored = readStorage<E2EUser | null>(E2E_USER_KEY, null);
	if (stored && stored.email === email) {
		return stored;
	}
	return {
		id: `e2e_${hashString(email)}`,
		email,
		created_at: new Date().toISOString()
	};
}

function getStoredUser(): E2EUser | null {
	return readStorage<E2EUser | null>(E2E_USER_KEY, null);
}

function setStoredUser(user: E2EUser): void {
	writeStorage(E2E_USER_KEY, user);
	setCookie(E2E_COOKIE_NAME, encodeURIComponent(JSON.stringify(user)));
}

function clearStoredUser(): void {
	removeStorage(E2E_USER_KEY);
	clearCookie(E2E_COOKIE_NAME);
}

function getStoredSession(): E2ESession | null {
	return readStorage<E2ESession | null>(E2E_SESSION_KEY, null);
}

function setStoredSession(session: E2ESession): void {
	writeStorage(E2E_SESSION_KEY, session);
}

function clearStoredSession(): void {
	removeStorage(E2E_SESSION_KEY);
}

function buildSession(user: E2EUser): E2ESession {
	return {
		access_token: `e2e-token-${user.id}`,
		user,
		expires_at: Math.floor(Date.now() / 1000) + 60 * 60
	};
}

function notifyAuth(event: string, session: E2ESession | null): void {
	authListeners.forEach((listener) => listener(event, session));
}

function createE2EClient(): SupabaseClient {
	const auth = {
		signUp: async ({ email }: { email: string }) => {
			const user = buildUser(email);
			setStoredUser(user);
			const session = buildSession(user);
			setStoredSession(session);
			notifyAuth('SIGNED_IN', session);
			return { data: { user: user as unknown as User }, error: null };
		},
		signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
			if (email !== allowedEmail || password !== allowedPassword) {
				return { data: { user: null }, error: { message: 'Invalid login credentials' } };
			}

			const user = buildUser(email);
			setStoredUser(user);
			const session = buildSession(user);
			setStoredSession(session);
			notifyAuth('SIGNED_IN', session);
			return { data: { user: user as unknown as User }, error: null };
		},
		signOut: async () => {
			clearStoredSession();
			clearStoredUser();
			notifyAuth('SIGNED_OUT', null);
			return { error: null };
		},
		getUser: async () => {
			const user = getStoredUser();
			return { data: { user: (user as unknown as User) ?? null }, error: null };
		},
		getSession: async () => {
			const session = getStoredSession();
			return { data: { session }, error: null };
		},
		onAuthStateChange: (callback: (event: string, session: E2ESession | null) => void) => {
			authListeners.add(callback);
			const session = getStoredSession();
			callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
			return {
				data: {
					subscription: {
						unsubscribe: () => authListeners.delete(callback)
					}
				}
			};
		},
		resetPasswordForEmail: async () => ({ error: null }),
		updateUser: async (updates: { email?: string }) => {
			const existing = getStoredUser();
			if (!existing) {
				return { data: { user: null }, error: { message: 'No user found' } };
			}
			const updated: E2EUser = {
				...existing,
				email: updates.email ?? existing.email
			};
			setStoredUser(updated);
			const session = buildSession(updated);
			setStoredSession(session);
			notifyAuth('USER_UPDATED', session);
			return { data: { user: updated as unknown as User }, error: null };
		},
		refreshSession: async () => {
			const session = getStoredSession();
			return { data: { session }, error: null };
		}
	};

	const storage = {
		from: () => ({
			upload: async () => ({ data: { path: 'e2e-avatar' }, error: null }),
			getPublicUrl: () => ({
				data: { publicUrl: 'https://example.com/e2e-avatar.png' }
			})
		})
	};

	return {
		auth,
		storage
	} as unknown as SupabaseClient;
}

// Create Supabase client for browser with cookie-based session storage
// This ensures session is shared with server-side auth checks
// Configure for longer session persistence (7 days refresh, 30 days absolute)
export const supabase = (
	isE2E
		? createE2EClient()
		: createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				auth: {
					persistSession: true,
					autoRefreshToken: true,
					detectSessionInUrl: true,
					flowType: 'pkce'
				}
			})
) as SupabaseClient;

// Type-safe database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
