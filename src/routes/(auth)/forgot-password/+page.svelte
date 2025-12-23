<!--
  Forgot Password Page - Full implementation with email validation
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Input, Alert } from '$lib/components';
	import { authService } from '$lib/services';
	import { isValidEmail } from '$lib/utils/validation';

	let email = $state('');
	let loading = $state(false);
	let submitted = $state(false);
	let error = $state<string | null>(null);

	let emailValid = $derived(isValidEmail(email));
	let canSubmit = $derived(emailValid && !loading);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		loading = true;
		error = null;

		const result = await authService.resetPassword(email);

		loading = false;

		if (result.error) {
			// Don't reveal if email exists for security
			// But still show generic errors (rate limiting, etc.)
			if (result.error.includes('rate limit')) {
				error = 'Too many requests. Please wait a moment and try again.';
			} else {
				// For most errors, just show success anyway for security
				submitted = true;
			}
			return;
		}

		submitted = true;
	}
</script>

<svelte:head>
	<title>Reset Password | The Unsaid</title>
</svelte:head>

{#if submitted}
	<div class="text-center">
		<div class="mb-4 text-4xl">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mx-auto h-16 w-16 text-success"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-semibold">Check your email</h2>
		<p class="mb-6 text-sm text-base-content/70">
			If an account exists with that email, you'll receive a password reset link shortly.
		</p>
		<a href={resolve('/login')} class="btn w-full btn-primary">Back to login</a>
	</div>
{:else}
	<h2 class="mb-2 text-xl font-semibold">Reset your password</h2>
	<p class="mb-6 text-sm text-base-content/70">
		Enter your email and we'll send you a link to reset your password.
	</p>

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

		<Button type="submit" class="w-full" disabled={!canSubmit} {loading}>
			{loading ? 'Sending...' : 'Send reset link'}
		</Button>
	</form>

	<div class="mt-6 text-center">
		<a href={resolve('/login')} class="link text-sm link-primary">Back to login</a>
	</div>
{/if}
