<!--
  AIConsentModal.svelte - Modal shown when user first tries to use AI features
  Explains what AI does and asks for consent before enabling

  Usage:
  <AIConsentModal
    userId={user.id}
    onConsent={() => handleConsent()}
    onDecline={() => closeModal()}
  />
-->
<script lang="ts">
	import { preferencesService } from '$lib/services';

	interface Props {
		userId: string;
		onConsent: () => void;
		onDecline: () => void;
	}

	let { userId, onConsent, onDecline }: Props = $props();

	// State
	let enabling = $state(false);
	let error = $state<string | null>(null);

	async function handleConsent() {
		enabling = true;
		error = null;

		const { error: saveError } = await preferencesService.enableAI(userId);

		if (saveError) {
			error = saveError;
			enabling = false;
			return;
		}

		onConsent();
	}

	function handleBackdropClick(event: MouseEvent) {
		// Only close if clicking the backdrop itself, not the modal content
		if (event.target === event.currentTarget) {
			onDecline();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onDecline();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal backdrop -->
<div
	class="modal-open modal"
	role="dialog"
	aria-modal="true"
	aria-labelledby="consent-title"
	tabindex="-1"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
>
	<div class="modal-box max-w-md border border-primary/20 shadow-xl">
		<!-- Header -->
		<h3 id="consent-title" class="flex items-center gap-2 text-lg font-bold">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 text-primary"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
				/>
			</svg>
			Enable AI Assistance
		</h3>

		<!-- Content -->
		<div class="space-y-4 py-4">
			<p class="text-base-content/70">
				AI features can help you articulate your feelings more clearly. Here's what happens:
			</p>

			<ul class="space-y-2 text-sm">
				<li class="flex items-start gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mt-0.5 h-5 w-5 shrink-0 text-success"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Your draft text is sent to our AI for suggestions</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mt-0.5 h-5 w-5 shrink-0 text-success"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>AI suggestions are generated in real-time</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mt-0.5 h-5 w-5 shrink-0 text-success"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Your data is not stored by the AI provider</span>
				</li>
			</ul>

			<!-- Privacy note -->
			<div class="rounded-lg bg-base-200/50 p-3 text-sm">
				<p class="text-base-content/60">
					<strong>Note:</strong> While AI processing is privacy-focused, your draft content will temporarily
					leave your device to generate suggestions. You can disable this anytime in Settings.
				</p>
			</div>

			<!-- Error display -->
			{#if error}
				<div class="alert text-sm alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={onDecline} disabled={enabling}> Not Now </button>
			<button
				class="btn transition-all duration-300 btn-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
				onclick={handleConsent}
				disabled={enabling}
			>
				{#if enabling}
					<span class="loading loading-sm loading-spinner"></span>
					Enabling...
				{:else}
					Enable AI Features
				{/if}
			</button>
		</div>
	</div>

	<!-- Backdrop -->
	<div class="modal-backdrop bg-black/50"></div>
</div>
