<!--
  AISuggestions.svelte - Displays AI suggestions with Apply/Dismiss actions
  Uses aiStore for state management and follows The Unsaid design language
  Usage: <AISuggestions onApply={(text) => {}} onDismiss={() => {}} />
-->
<script lang="ts">
	import { aiStore } from '$lib/stores/ai.svelte';
	import { networkStore } from '$lib/stores/network.svelte';
	import { aiService } from '$lib/services/ai';
	import { Alert } from '$lib/components';

	interface Props {
		onApply?: (text: string) => void;
		onDismiss?: () => void;
		class?: string;
	}

	let { onApply, onDismiss, class: className = '' }: Props = $props();

	// Derived state from aiStore
	let isLoading = $derived(aiStore.isLoading);
	let hasSuggestions = $derived(aiStore.hasSuggestions);
	let suggestions = $derived(aiStore.suggestions);
	let error = $derived(aiStore.error);
	let activeMode = $derived(aiStore.activeMode);
	let status = $derived(aiStore.status);
	let canRetry = $derived(aiStore.canRetry);
	let isOffline = $derived(!networkStore.isOnline);
	let isSingleSuggestion = $derived(suggestions.length === 1);
	let primarySuggestion = $derived(suggestions[0] ?? null);

	// Get mode label and description
	let modeLabel = $derived(activeMode ? aiService.getModeLabel(activeMode) : '');
	let modeDescription = $derived(activeMode ? aiService.getModeDescription(activeMode) : '');

	// Should show the component
	let isVisible = $derived(status !== 'idle');

	function handleApply(text: string) {
		onApply?.(text);
		aiStore.dismissSuggestions();
	}

	function handleDismiss() {
		onDismiss?.();
		aiStore.dismissSuggestions();
	}

	async function handleRetry() {
		await aiStore.retryLastRequest();
	}
</script>

{#if isVisible}
	<div
		data-testid="ai-suggestions"
		class="ai-suggestions ai-suggestions-container animate-slideUp rounded-xl border border-secondary/20 bg-base-100 shadow-lg {className}"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-base-content/10 px-4 py-3">
			<div class="flex items-center gap-2">
				<!-- AI Icon -->
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 text-secondary"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
						/>
					</svg>
				</div>
				<div>
					<h4 class="text-sm font-semibold text-base-content">{modeLabel}</h4>
					{#if modeDescription && !isLoading}
						<p class="text-xs text-base-content/60">{modeDescription}</p>
					{/if}
				</div>
			</div>

			<!-- Close button -->
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				onclick={handleDismiss}
				aria-label="Dismiss suggestions"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="sr-only">Dismiss</span>
			</button>
		</div>

		<!-- Content Area -->
		<div class="max-h-80 overflow-y-auto p-4">
			<!-- Loading State with Skeleton Cards -->
			{#if isLoading}
				<div class="space-y-3">
					<!-- Skeleton Cards -->
					{#each [1, 2, 3] as idx (idx)}
						<div class="rounded-lg border border-base-content/10 bg-base-200/50 p-4">
							<div class="animate-pulse space-y-2">
								<div class="flex items-center gap-2">
									<div class="h-5 w-16 skeleton rounded bg-base-300"></div>
								</div>
								<div class="h-4 w-full skeleton rounded bg-base-300"></div>
								<div class="h-4 w-3/4 skeleton rounded bg-base-300"></div>
								<div class="mt-2 h-3 w-1/2 skeleton rounded bg-base-300"></div>
							</div>
						</div>
					{/each}
					<p class="text-center text-sm text-base-content/60">
						<span class="loading loading-sm loading-dots"></span>
						Analyzing your words...
					</p>
				</div>

				<!-- Error State -->
			{:else if error}
				<div class="space-y-3">
					<Alert type="error">
						<div class="space-y-1 text-left">
							<p class="font-medium">We couldn't generate suggestions.</p>
							<p class="text-sm text-base-content/80">{error}</p>
							{#if isOffline}
								<p class="text-xs text-base-content/70">You're offline. Reconnect to try again.</p>
							{/if}
						</div>
					</Alert>
					<div class="flex justify-center gap-2">
						<button
							type="button"
							class="btn gap-1 btn-sm btn-primary"
							onclick={handleRetry}
							disabled={!canRetry || isLoading}
						>
							{#if isLoading}
								<span class="loading loading-xs loading-spinner"></span>
							{/if}
							Try Again
						</button>
						<button type="button" class="btn btn-ghost btn-sm" onclick={handleDismiss}>
							Dismiss
						</button>
					</div>
				</div>

				<!-- Suggestions List -->
			{:else if hasSuggestions}
				{#if isSingleSuggestion && primarySuggestion}
					<div
						class="ai-suggestion cursor-pointer rounded-lg p-4 transition-all duration-200 hover:shadow-md"
						onclick={() => handleApply(primarySuggestion.text)}
						onkeydown={(e) => e.key === 'Enter' && handleApply(primarySuggestion.text)}
						role="button"
						tabindex="0"
					>
						<p class="leading-relaxed text-base-content">{primarySuggestion.text}</p>
					</div>
				{:else}
					<div class="space-y-3">
						<!-- Suggestion Cards -->
						{#each suggestions as suggestion, index (index)}
							<div
								class="ai-suggestion group cursor-pointer rounded-lg p-4 transition-all duration-200 hover:shadow-md"
								onclick={() => handleApply(suggestion.text)}
								onkeydown={(e) => e.key === 'Enter' && handleApply(suggestion.text)}
								role="button"
								tabindex="0"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<!-- Option Number Badge -->
										<div class="mb-2 flex items-center gap-2">
											<span class="badge badge-sm badge-secondary">Option {index + 1}</span>
										</div>

										<!-- Suggestion Text -->
										<p class="leading-relaxed text-base-content">{suggestion.text}</p>
									</div>

									<!-- Apply Button (visible on hover) -->
									<button
										type="button"
										class="btn opacity-0 transition-opacity duration-200 btn-sm btn-primary group-hover:opacity-100"
										onclick={(e) => {
											e.stopPropagation();
											handleApply(suggestion.text);
										}}
									>
										Apply
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Empty State (shouldn't happen but just in case) -->
			{:else}
				<div class="py-8 text-center">
					<p class="text-sm text-base-content/60">No suggestions available</p>
				</div>
			{/if}
		</div>

		<!-- Footer with Dismiss -->
		{#if hasSuggestions}
			<div class="flex items-center justify-between border-t border-base-content/10 px-4 py-3">
				{#if isSingleSuggestion && primarySuggestion}
					<button
						type="button"
						class="btn btn-sm btn-primary"
						onclick={() => handleApply(primarySuggestion.text)}
					>
						Apply
					</button>
				{:else}
					<p class="text-xs text-base-content/40">Click a suggestion to apply it</p>
				{/if}
				<button type="button" class="btn btn-ghost btn-sm" onclick={handleDismiss}>
					Keep Original
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Slide up animation for suggestions panel */
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

	:global(.animate-slideUp) {
		animation: slideUp 0.3s ease-out forwards;
	}

	/* Custom scrollbar for suggestions */
	.max-h-80::-webkit-scrollbar {
		width: 4px;
	}

	.max-h-80::-webkit-scrollbar-track {
		background: transparent;
	}

	.max-h-80::-webkit-scrollbar-thumb {
		background: oklch(var(--bc) / 0.2);
		border-radius: 2px;
	}

	.max-h-80::-webkit-scrollbar-thumb:hover {
		background: oklch(var(--bc) / 0.3);
	}
</style>
