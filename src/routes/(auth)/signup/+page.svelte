<!--
  Sign Up Page - Full implementation with password strength and validation
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Input, Alert, PasswordStrength } from '$lib/components';
	import { authService, keyDerivationService } from '$lib/services';
	import { validatePassword, isValidEmail } from '$lib/utils/validation';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Derived password validation
	let passwordValidation = $derived(validatePassword(password));
	let passwordsMatch = $derived(password === confirmPassword && password.length > 0);
	let emailValid = $derived(isValidEmail(email));
	let canSubmit = $derived(emailValid && passwordValidation.valid && passwordsMatch && !loading);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		loading = true;
		error = null;

		const result = await authService.signUp({ email, password });

		if (result.error) {
			error = result.error;
			loading = false;
			return;
		}

		// Derive encryption key from password for new user
		const keyResult = await keyDerivationService.deriveAndStoreKey(result.user!.id, password);

		if (!keyResult.success) {
			error = 'Failed to set up encryption. Please try again.';
			// Log out since we can't encrypt without the key
			await authService.logout();
			loading = false;
			return;
		}

		// Signup successful - redirect to app
		loading = false;
		goto(resolve('/write'));
	}
</script>

<svelte:head>
	<title>Sign Up | The Unsaid</title>
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

<h2 class="mb-6 text-2xl font-semibold tracking-tight">Create your account</h2>

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
		error={email.length > 0 && !emailValid ? 'Please enter a valid email address' : undefined}
	/>

	<div class="space-y-2">
		<Input
			type="password"
			label="Password"
			placeholder="Create a strong password"
			required
			autocomplete="new-password"
			bind:value={password}
		/>
		{#if password.length > 0}
			<PasswordStrength {password} />
		{/if}
	</div>

	<Input
		type="password"
		label="Confirm Password"
		placeholder="Confirm your password"
		required
		autocomplete="new-password"
		bind:value={confirmPassword}
		error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords don't match" : undefined}
	/>

	{#if confirmPassword.length > 0 && passwordsMatch}
		<div class="flex items-center gap-2 text-sm text-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>Passwords match</span>
		</div>
	{/if}

<Button type="submit" class="w-full btn-cta" disabled={!canSubmit} {loading}>
		{loading ? 'Creating account...' : 'Create account'}
	</Button>
</form>

<div class="divider">or</div>

<p class="text-center text-sm">
	Already have an account?
	<a href={resolve('/login')} class="link link-primary">Log in</a>
</p>
