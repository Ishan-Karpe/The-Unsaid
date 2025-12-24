<!--
  Password Reset Page - Set new password after clicking email link
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Input, Alert, PasswordStrength } from '$lib/components';
	import { supabase } from '$lib/services/supabase';
	import { validatePassword } from '$lib/utils/validation';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	let validation = $derived(validatePassword(password));
	let passwordsMatch = $derived(password === confirmPassword && password.length > 0);
	let canSubmit = $derived(validation.valid && passwordsMatch && !loading);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		loading = true;
		error = null;

		const { error: updateError } = await supabase.auth.updateUser({ password });

		if (updateError) {
			if (updateError.message.includes('same as')) {
				error = 'New password must be different from your current password.';
			} else {
				error = updateError.message;
			}
			loading = false;
			return;
		}

		success = true;
		loading = false;
		setTimeout(() => goto(resolve('/login')), 2000);
	}
</script>

<svelte:head>
	<title>Set New Password | The Unsaid</title>
</svelte:head>

{#if success}
	<div class="text-center">
		<div class="mb-4">
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
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-semibold">Password updated!</h2>
		<p class="mb-4 text-sm text-base-content/70">
			Your password has been reset successfully. Redirecting to login...
		</p>
		<a href={resolve('/login')} class="btn w-full btn-primary">Go to Login</a>
	</div>
{:else}
	<h2 class="mb-2 text-xl font-semibold">Set new password</h2>
	<p class="mb-6 text-sm text-base-content/70">
		Enter your new password below. Make sure it's strong and memorable.
	</p>

	{#if error}
		<Alert type="error" class="mb-4">
			{error}
		</Alert>
	{/if}

	<form class="space-y-4" onsubmit={handleSubmit}>
		<div class="space-y-2">
			<Input
				type="password"
				label="New Password"
				placeholder="Enter new password"
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
			placeholder="Confirm new password"
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

		<Button type="submit" class="w-full" disabled={!canSubmit} {loading}>
			{loading ? 'Updating...' : 'Update password'}
		</Button>
	</form>

	<div class="mt-6 text-center">
		<a href={resolve('/login')} class="link text-sm link-primary">Back to login</a>
	</div>
{/if}
