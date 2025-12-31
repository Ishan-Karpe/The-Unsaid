<!--
  RecentlyUsed.svelte - Recently used prompts section
  Displays the user's recently used prompts for quick access
  Usage: <RecentlyUsed onUse={(id) => {}} />
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ConversationPrompt } from '$lib/types';
	import { getRecentlyUsedPrompts } from '$lib/data/prompts';
	import PromptCard from './PromptCard.svelte';

	interface Props {
		onUse?: (promptId: string) => void;
		class?: string;
	}

	let { onUse, class: className = '' }: Props = $props();

	let recentPrompts = $state<ConversationPrompt[]>([]);
	let isVisible = $state(false);
	let isMounted = $state(false);

	// Handle window event for prompt-used
	function handlePromptUsed() {
		refreshRecent();
	}

	onMount(() => {
		isMounted = true;
		refreshRecent();
		setTimeout(() => (isVisible = true), 100);

		// Listen for custom event
		window.addEventListener('prompt-used', handlePromptUsed);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('prompt-used', handlePromptUsed);
		}
	});

	// Refresh on custom event (when a prompt is used)
	function refreshRecent() {
		if (!isMounted) return;
		recentPrompts = getRecentlyUsedPrompts();
	}

	function handleUsePrompt(promptId: string) {
		onUse?.(promptId);
	}
</script>

{#if recentPrompts.length > 0}
	<div class="recently-used fade-in {isVisible ? 'visible' : ''} {className}">
		<div class="mb-4 flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 text-primary"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
					clip-rule="evenodd"
				/>
			</svg>
			<h2 class="text-lg font-semibold text-base-content">Recently Used</h2>
			<span class="badge badge-ghost badge-sm">{recentPrompts.length}</span>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each recentPrompts as prompt (prompt.id)}
				<PromptCard {prompt} onUse={handleUsePrompt} showRelationship={true} />
			{/each}
		</div>
	</div>
{/if}

<style>
	.fade-in {
		opacity: 0;
		transform: translateY(10px);
		transition:
			opacity 0.4s ease-out,
			transform 0.4s ease-out;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}
</style>
