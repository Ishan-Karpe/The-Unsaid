// ===========================================
// THE UNSAID - Auth Store (Svelte 5 Runes)
// ===========================================
import type { User } from '$lib/types';

// Reactive state using Svelte 5 runes (module-level state)
let user = $state<User | null>(null);
let loading = $state<boolean>(true);
let error = $state<string | null>(null);

export const authStore = {
	get user() {
		return user;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get isAuthenticated() {
		return user !== null;
	},

	setUser(newUser: User | null) {
		user = newUser;
		loading = false;
		error = null;
	},

	setLoading(isLoading: boolean) {
		loading = isLoading;
	},

	setError(errorMessage: string | null) {
		error = errorMessage;
		loading = false;
	},

	clear() {
		user = null;
		loading = false;
		error = null;
	}
};
