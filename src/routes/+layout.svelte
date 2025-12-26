<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/services/supabase';
	import { keyDerivationService } from '$lib/services';
	import { PasswordPrompt } from '$lib/components/ui';
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

			if (user && !error && !keyDerivationService.isKeyReady()) {
				// Session exists but no encryption key - need password to restore
				needsPasswordPrompt = true;
			}
		};

		checkInitialState();

		// Listen for auth state changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event) => {
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
		// Don't reload - the key is now in memory and components will re-render
		// Trigger a custom event so components know to refresh their data
		window.dispatchEvent(new CustomEvent('encryption-key-restored'));
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

<!-- App shell with theme support -->
<div class="min-h-screen bg-base-100 text-base-content">
	{@render children()}
</div>

<!-- Password prompt for session restoration -->
{#if needsPasswordPrompt}
	<PasswordPrompt onSuccess={handlePasswordSuccess} onCancel={handlePasswordCancel} />
{/if}
