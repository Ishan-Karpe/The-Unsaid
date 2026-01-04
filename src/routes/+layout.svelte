<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/services/supabase';
	import { keyDerivationService } from '$lib/services';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		PasswordPrompt,
		ToastContainer,
		ErrorBoundary,
		OfflineIndicator
	} from '$lib/components/ui';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// Track if we need to show password prompt for session restoration
	let needsPasswordPrompt = $state(false);
	// Track if we've already checked initial state to prevent re-checking
	let initialCheckDone = $state(false);

	// Initialize auth state and handle session changes
	onMount(() => {
		// Check initial state - if session exists but no encryption key, prompt for password
		const checkInitialState = async () => {
			// Only check once per mount to avoid race conditions
			if (initialCheckDone) return;
			initialCheckDone = true;

			// Use getUser() for secure verification instead of getSession()
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();

			if (user && !error) {
				// Update auth store with current user
				authStore.setUser(user);

				if (!keyDerivationService.isKeyReady()) {
					// Session exists but no encryption key - need password to restore
					needsPasswordPrompt = true;
				}
			} else {
				authStore.setUser(null);
			}
		};

		checkInitialState();

		// Listen for auth state changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (session?.user) {
				authStore.setUser(session.user);
			} else {
				authStore.setUser(null);
			}

			if (event === 'SIGNED_IN') {
				// User signed in - key will be derived in login page after sign in
				// Don't prompt here since login flow handles key derivation
			} else if (event === 'SIGNED_OUT') {
				// Clear encryption key on sign out
				keyDerivationService.clearEncryptionKey();
				needsPasswordPrompt = false;
				initialCheckDone = false; // Reset for next login
			} else if (event === 'TOKEN_REFRESHED') {
				// Token refreshed - encryption key should still be in memory
				// If not, prompt for password to restore access
				const hasKey = keyDerivationService.isKeyReady();
				if (!hasKey && !needsPasswordPrompt) {
					needsPasswordPrompt = true;
				}
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	function handlePasswordSuccess() {
		needsPasswordPrompt = false;
		// Trigger a custom event so components know to refresh their data
		window.dispatchEvent(new CustomEvent('encryption-key-restored'));
		// Redirect to /write after successful unlock
		goto(resolve('/write'));
	}

	function handlePasswordCancel() {
		needsPasswordPrompt = false;
		// Sign out if user cancels password prompt
		supabase.auth.signOut();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Turn feelings into words. The Unsaid helps you express important things to people who matter most."
	/>
	<meta name="theme-color" content="#6366f1" />
</svelte:head>

<!-- Skip link for keyboard navigation - visible only on focus -->
<a href="#main-content" class="skip-link"> Skip to main content </a>

<!-- App shell with theme support -->
<div class="min-h-screen bg-base-100 text-base-content">
	<main id="main-content" tabindex="-1">
		<ErrorBoundary
			fallbackTitle="Something went wrong"
			fallbackDescription="We encountered an unexpected error. Please try refreshing the page."
			variant="full"
		>
			{@render children()}
		</ErrorBoundary>
	</main>
</div>

<!-- Password prompt for session restoration -->
{#if needsPasswordPrompt}
	<PasswordPrompt onSuccess={handlePasswordSuccess} onCancel={handlePasswordCancel} />
{/if}

<!-- Toast notifications container -->
<ToastContainer />

<!-- Offline status indicator -->
<OfflineIndicator />
