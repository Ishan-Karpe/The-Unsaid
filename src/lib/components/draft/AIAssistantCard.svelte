<!--
  AIAssistantCard.svelte - Unified AI assistant interface
  Combines mode selector, loading skeleton, and suggestions display
  Usage: <AIAssistantCard onApply={(text) => {}} onRequestAI={(mode) => {}} hasContent={true} />
-->
<script lang="ts">
	import type { AIMode } from '$lib/types';
	import { aiStore } from '$lib/stores/ai.svelte';
	import { aiService } from '$lib/services/ai';
	import { AIModeSelector } from '$lib/components';

	interface Props {
		onApply: (text: string) => void;
		onRequestAI: (mode: AIMode) => void;
		hasContent: boolean;
		class?: string;
	}

	let { onApply, onRequestAI, hasContent, class: className = '' }: Props = $props();

	// Store state
	let activeMode = $derived(aiStore.activeMode);
	let suggestions = $derived(aiStore.suggestions);
	let error = $derived(aiStore.error);
	let isLoading = $derived(aiStore.isLoading);

	// Mode label for header
	let modeLabel = $derived(activeMode ? aiService.getModeLabel(activeMode) : 'AI Assistant');

	function handleModeSelect(mode: AIMode) {
		if (!hasContent || isLoading) return;
		onRequestAI(mode);
	}

	function handleApply(text: string) {
		onApply(text);
		aiStore.dismissSuggestions();
	}

	function handleDismiss() {
		aiStore.dismissSuggestions();
	}
</script>

<div class="ai-assistant card border border-base-content/10 bg-base-200 shadow-sm {className}">
	<div class="card-body gap-4 p-4">
		<!-- Header -->
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 text-primary"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path
					d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
				/>
			</svg>
			<h3 class="text-sm font-semibold tracking-wider text-base-content/70 uppercase">
				{modeLabel}
			</h3>
		</div>

		<!-- Mode Selector (Button Group) -->
		<AIModeSelector {activeMode} onSelect={handleModeSelect} disabled={!hasContent || isLoading} />

		<!-- Content Area -->
		{#if isLoading}
			<!-- Skeleton Loading State -->
			<div class="space-y-3">
				{#each [1, 2, 3] as idx (idx)}
					<div class="rounded-lg border border-base-content/10 bg-base-100 p-4">
						<div class="animate-pulse space-y-2">
							<div class="flex items-center gap-2">
								<div class="h-5 w-16 skeleton rounded"></div>
							</div>
							<div class="h-4 w-full skeleton rounded"></div>
							<div class="h-4 w-3/4 skeleton rounded"></div>
							<div class="mt-2 h-3 w-1/2 skeleton rounded"></div>
						</div>
					</div>
				{/each}
			</div>
			<p class="text-center text-sm text-base-content/60">
				<span class="loading loading-sm loading-dots"></span>
				Analyzing your words...
			</p>
		{:else if error}
			<!-- Error State -->
			<div class="alert alert-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span class="text-sm">{error}</span>
			</div>
			<button type="button" class="btn self-center btn-ghost btn-sm" onclick={handleDismiss}>
				Dismiss
			</button>
		{:else if suggestions.length > 0}
			<!-- Suggestions Display -->
			<div class="space-y-2">
				{#each suggestions as suggestion, index (index)}
					<button
						type="button"
						class="group w-full rounded-lg border border-base-content/10 bg-base-100 p-3 text-left transition-all hover:border-primary/30 hover:shadow-md focus:ring-2 focus:ring-primary/50 focus:outline-none"
						onclick={() => handleApply(suggestion.text)}
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<p class="line-clamp-3 text-sm leading-relaxed text-base-content">
									{suggestion.text}
								</p>
								{#if suggestion.why}
									<p class="mt-1 line-clamp-1 text-xs text-base-content/50">
										{suggestion.why}
									</p>
								{/if}
							</div>
							<span
								class="badge badge-sm opacity-0 transition-opacity badge-primary group-hover:opacity-100"
							>
								Apply
							</span>
						</div>
					</button>
				{/each}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-base-content/10 pt-2">
				<p class="text-xs text-base-content/40">Click to apply</p>
				<button type="button" class="btn btn-ghost btn-xs" onclick={handleDismiss}>
					Keep Original
				</button>
			</div>
		{:else if !hasContent}
			<!-- No Content State -->
			<div class="py-6 text-center">
				<p class="text-sm text-base-content/50">Start writing to use AI assistance</p>
			</div>
		{:else}
			<!-- Idle State - Ready to Use -->
			<div class="py-6 text-center">
				<p class="text-sm text-base-content/50">Select a mode above to get AI suggestions</p>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Line clamp utilities */
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
