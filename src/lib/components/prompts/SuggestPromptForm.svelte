<!--
  SuggestPromptForm.svelte - User prompt suggestion form
  A modal form for users to suggest new prompts to the library
  Usage: <SuggestPromptForm open={showForm} onClose={() => {}} onSubmit={(data) => {}} />
-->
<script lang="ts">
	import type { RelationshipCategory, PromptSituation } from '$lib/types';
	import { relationshipLabels, situationLabels } from '$lib/data/prompts';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSubmit?: (data: PromptSuggestion) => void;
	}

	interface PromptSuggestion {
		text: string;
		relationship: RelationshipCategory;
		situation: PromptSituation;
		email?: string;
	}

	let { open, onClose, onSubmit }: Props = $props();

	// Form state
	let text = $state('');
	let relationship = $state<RelationshipCategory>('parents');
	let situation = $state<PromptSituation>('appreciation');
	let email = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);

	const relationships: RelationshipCategory[] = ['parents', 'partners', 'friends', 'grief', 'self'];
	const situations: PromptSituation[] = [
		'appreciation',
		'understanding',
		'apology',
		'honesty',
		'reconnection',
		'regret',
		'legacy',
		'healing',
		'gratitude',
		'vulnerability',
		'forgiveness',
		'encouragement'
	];

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!text.trim()) return;

		isSubmitting = true;

		try {
			const suggestion: PromptSuggestion = {
				text: text.trim(),
				relationship,
				situation,
				email: email.trim() || undefined
			};

			// Store in localStorage for demo (in production, send to API)
			if (typeof window !== 'undefined') {
				try {
					const existing = localStorage.getItem('unsaid-prompt-suggestions');
					const suggestions = existing ? JSON.parse(existing) : [];
					suggestions.push({ ...suggestion, timestamp: Date.now() });
					localStorage.setItem('unsaid-prompt-suggestions', JSON.stringify(suggestions));
				} catch {
					// Ignore localStorage errors
				}
			}

			onSubmit?.(suggestion);
			submitted = true;

			// Reset after delay
			setTimeout(() => {
				resetForm();
				onClose();
			}, 2000);
		} catch (error) {
			console.error('Failed to submit suggestion:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		text = '';
		relationship = 'parents';
		situation = 'appreciation';
		email = '';
		submitted = false;
	}

	function handleClose() {
		if (!isSubmitting) {
			resetForm();
			onClose();
		}
	}

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="suggest-title"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="animate-slideUp card w-full max-w-lg bg-base-100 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="card-body gap-4">
				{#if submitted}
					<!-- Success State -->
					<div class="py-8 text-center">
						<div class="mb-4 flex justify-center">
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>
						<h3 class="text-xl font-semibold text-base-content">Thank You!</h3>
						<p class="mt-2 text-base-content/70">Your prompt suggestion has been received.</p>
					</div>
				{:else}
					<!-- Form -->
					<div class="flex items-center justify-between">
						<h2 id="suggest-title" class="text-xl font-semibold text-base-content">
							Suggest a Prompt
						</h2>
						<button
							type="button"
							class="btn btn-circle btn-ghost btn-sm"
							onclick={handleClose}
							aria-label="Close"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>

					<p class="text-sm text-base-content/70">
						Have a conversation starter that helped you? Share it with the community.
					</p>

					<form onsubmit={handleSubmit} class="space-y-4">
						<!-- Prompt Text -->
						<div class="form-control">
							<label class="label" for="prompt-text">
								<span class="label-text font-medium">Your prompt</span>
							</label>
							<textarea
								id="prompt-text"
								bind:value={text}
								class="textarea-bordered textarea h-24"
								placeholder="e.g., 'I want you to know that...'"
								required
							></textarea>
						</div>

						<!-- Category Selects -->
						<div class="grid grid-cols-2 gap-4">
							<div class="form-control">
								<label class="label" for="relationship">
									<span class="label-text font-medium">Relationship</span>
								</label>
								<select id="relationship" bind:value={relationship} class="select-bordered select">
									{#each relationships as rel (rel)}
										<option value={rel}>{relationshipLabels[rel]}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="situation">
									<span class="label-text font-medium">Situation</span>
								</label>
								<select id="situation" bind:value={situation} class="select-bordered select">
									{#each situations as sit (sit)}
										<option value={sit}>{situationLabels[sit]}</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- Email (optional) -->
						<div class="form-control">
							<label class="label" for="email">
								<span class="label-text font-medium">Email (optional)</span>
								<span class="label-text-alt text-base-content/50"
									>For credit if we use your prompt</span
								>
							</label>
							<input
								type="email"
								id="email"
								bind:value={email}
								class="input-bordered input"
								placeholder="your@email.com"
							/>
						</div>

						<!-- Submit Button -->
						<div class="flex justify-end gap-2 pt-2">
							<button
								type="button"
								class="btn btn-ghost"
								onclick={handleClose}
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button type="submit" class="btn btn-primary" disabled={!text.trim() || isSubmitting}>
								{#if isSubmitting}
									<span class="loading loading-sm loading-spinner"></span>
									Submitting...
								{:else}
									Submit Suggestion
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out forwards;
	}
</style>
