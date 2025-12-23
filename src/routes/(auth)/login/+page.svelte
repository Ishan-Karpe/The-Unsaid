<!--
  Login Page - Full implementation with auth and redirect handling
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { Button, Input, Alert } from '$lib/components';
	import { authService } from '$lib/services';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Get redirect destination and check for confirmation message
	let redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/write');
	let confirmed = $derived($page.url.searchParams.get('confirmed') === 'true');

	let canSubmit = $derived(email.length > 0 && password.length > 0 && !loading);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		loading = true;
		error = null;

		const result = await authService.login({ email, password });

		if (result.error) {
			// Friendly error messages
			if (result.error.includes('Invalid login')) {
				error = 'Invalid email or password. Please try again.';
			} else if (result.error.includes('Email not confirmed')) {
				error = 'Please check your email and confirm your account first.';
			} else {
				error = result.error;
			}
			loading = false;
			return;
		}

		authStore.setUser(result.user);
		await invalidateAll();
		goto(redirectTo);
	}
</script>

<svelte:head>
	<title>Login | The Unsaid</title>
</svelte:head>

<div class="mb-4">
	<a
		href={resolve('/')}
		class="inline-flex items-center gap-1 text-sm text-base-content/60 transition-colors hover:text-base-content"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd"
			/>
		</svg>
		Back to home
	</a>
</div>

<h2 class="mb-6 text-xl font-semibold">Welcome back</h2>

{#if confirmed}
	<Alert type="success" class="mb-4">Your email has been confirmed! You can now log in.</Alert>
{/if}

{#if error}
	<Alert type="error" class="mb-4">
		{error}
	</Alert>
{/if}

<form class="space-y-4" onsubmit={handleSubmit}>
	<Input
		type="email"
		label="Email"
		placeholder="you@example.com"
		required
		autocomplete="email"
		bind:value={email}
	/>

	<Input
		type="password"
		label="Password"
		placeholder="Your password"
		required
		autocomplete="current-password"
		bind:value={password}
	/>

	<div class="flex items-center justify-between text-sm">
		<label class="flex cursor-pointer items-center gap-2">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={rememberMe} />
			<span>Remember me</span>
		</label>
		<a href={resolve('/forgot-password')} class="link link-primary">Forgot password?</a>
	</div>

	<Button type="submit" class="w-full" disabled={!canSubmit} {loading}>
		{loading ? 'Logging in...' : 'Log in'}
	</Button>
</form>

<div class="divider">or</div>

<p class="text-center text-sm">
	Don't have an account?
	<a href={resolve('/signup')} class="link link-primary">Sign up</a>
</p>
