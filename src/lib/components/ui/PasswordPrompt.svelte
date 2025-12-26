<script lang="ts">
	import { keyDerivationService } from '$lib/services';
	import { supabase } from '$lib/services/supabase';

	interface Props {
		onSuccess?: () => void;
		onCancel?: () => void;
	}

	let { onSuccess, onCancel }: Props = $props();

	let password = $state('');
	let error = $state<string | null>(null);
	let isProcessing = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!password.trim()) {
			error = 'Please enter your password';
			return;
		}

		isProcessing = true;

		try {
			// Get current user from session
			const {
				data: { user },
				error: userError
			} = await supabase.auth.getUser();

			if (userError || !user) {
				error = 'Session expired. Please sign in again.';
				isProcessing = false;
				return;
			}

			// Derive encryption key
			const result = await keyDerivationService.deriveAndStoreKey(user.id, password);

			if (!result.success || result.error) {
				error = result.error || 'Failed to restore encryption key';
				isProcessing = false;
				return;
			}

			// Success - encryption key is now available
			password = ''; // Clear password from memory
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to restore encryption key';
			isProcessing = false;
		}
	}

	function handleCancel() {
		password = '';
		error = null;
		onCancel?.();
	}
</script>

<div class="modal-open modal">
	<div class="modal-box max-w-md">
		<h3 class="mb-4 text-lg font-bold">Password Required</h3>

		<p class="mb-6 text-sm text-base-content/70">
			Your session has been restored, but we need your password to decrypt your drafts. Your
			password is never stored and is only used to derive your encryption key.
		</p>

		<form onsubmit={handleSubmit}>
			<div class="form-control">
				<label class="label" for="password-input">
					<span class="label-text">Password</span>
				</label>
				<input
					id="password-input"
					type="password"
					autocomplete="current-password"
					class="input-bordered input w-full"
					placeholder="Enter your password"
					bind:value={password}
					disabled={isProcessing}
				/>
			</div>

			{#if error}
				<div class="mt-4 alert alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={handleCancel} disabled={isProcessing}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary" disabled={isProcessing || !password.trim()}>
					{#if isProcessing}
						<span class="loading loading-sm loading-spinner"></span>
						Restoring...
					{:else}
						Unlock Drafts
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
