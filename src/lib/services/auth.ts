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
	async signUp({
		email,
		password
	}: SignUpData): Promise<{ user: User | null; error: string | null }> {
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
	async login({
		email,
		password
	}: LoginData): Promise<{ user: User | null; error: string | null }> {
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
		// Clear "remember me" preference on logout
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('unsaid_remember_me');
		}
		const { error } = await supabase.auth.signOut();
		return { error: error?.message || null };
	},

	/**
	 * Get current user (securely verified)
	 */
	async getUser() {
		const { data, error } = await supabase.auth.getUser();
		return { user: data.user, error: error?.message || null };
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
	},

	/**
	 * Delete the current user's account
	 *
	 * This deletes all user data including:
	 * - All drafts (active and deleted)
	 * - User preferences
	 * - Encryption salt
	 * - The auth account itself
	 *
	 * @returns Error if deletion failed
	 *
	 * @note In production, this would call a backend endpoint
	 * that uses the Supabase admin API to delete the user.
	 */
	async deleteAccount(): Promise<{ error: string | null }> {
		// For now, we'll use Supabase's sign out and let the user know
		// that account deletion requires manual intervention.
		// In production, this would call a backend endpoint that:
		// 1. Deletes all drafts
		// 2. Deletes user_salts
		// 3. Deletes user_preferences
		// 4. Uses supabase.auth.admin.deleteUser(userId)

		try {
			// Get current user
			const { user, error: userError } = await this.getUser();
			if (userError || !user) {
				return { error: userError || 'No user logged in' };
			}

			// Delete user data via API (this would be a real endpoint in production)
			const response = await fetch('/api/account/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			if (!response.ok) {
				const data = await response.json();
				return { error: data.error || 'Failed to delete account' };
			}

			// Sign out
			await this.logout();

			return { error: null };
		} catch (err) {
			return {
				error: err instanceof Error ? err.message : 'Failed to delete account'
			};
		}
	}
};
