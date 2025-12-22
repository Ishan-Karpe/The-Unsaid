// ===========================================
// THE UNSAID - Auth Service
// ===========================================
import { supabase } from './supabase';
import type { User } from '$lib/types';

export interface SignUpData {
	email: string;
	password: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export const authService = {
	/**
	 * Sign up a new user
	 */
	async signUp({ email, password }: SignUpData): Promise<{ user: User | null; error: string | null }> {
		const { data, error } = await supabase.auth.signUp({
			email,
			password
		});

		if (error) {
			return { user: null, error: error.message };
		}

		if (!data.user) {
			return { user: null, error: 'Failed to create account' };
		}

		return {
			user: {
				id: data.user.id,
				email: data.user.email!,
				created_at: data.user.created_at
			},
			error: null
		};
	},

	/**
	 * Log in an existing user
	 */
	async login({ email, password }: LoginData): Promise<{ user: User | null; error: string | null }> {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return { user: null, error: error.message };
		}

		if (!data.user) {
			return { user: null, error: 'Failed to log in' };
		}

		return {
			user: {
				id: data.user.id,
				email: data.user.email!,
				created_at: data.user.created_at
			},
			error: null
		};
	},

	/**
	 * Log out current user
	 */
	async logout(): Promise<{ error: string | null }> {
		const { error } = await supabase.auth.signOut();
		return { error: error?.message || null };
	},

	/**
	 * Get current session
	 */
	async getSession() {
		const { data, error } = await supabase.auth.getSession();
		return { session: data.session, error: error?.message || null };
	},

	/**
	 * Get current user
	 */
	async getCurrentUser(): Promise<User | null> {
		const { data } = await supabase.auth.getUser();
		if (!data.user) return null;

		return {
			id: data.user.id,
			email: data.user.email!,
			created_at: data.user.created_at
		};
	},

	/**
	 * Send password reset email
	 */
	async resetPassword(email: string): Promise<{ error: string | null }> {
		const { error } = await supabase.auth.resetPasswordForEmail(email);
		return { error: error?.message || null };
	},

	/**
	 * Listen to auth state changes
	 */
	onAuthStateChange(callback: (user: User | null) => void) {
		return supabase.auth.onAuthStateChange((event, session) => {
			if (session?.user) {
				callback({
					id: session.user.id,
					email: session.user.email!,
					created_at: session.user.created_at
				});
			} else {
				callback(null);
			}
		});
	}
};
