<!--
  AIModeSelector.svelte - Tab/button group for AI mode selection
  Displays all 5 AI modes as a horizontal button group with responsive labels
  Usage: <AIModeSelector activeMode={mode} onSelect={(m) => handleMode(m)} disabled={loading} />
-->
<script lang="ts">
	import type { AIMode } from '$lib/types';

	interface Props {
		activeMode: AIMode | null;
		onSelect: (mode: AIMode) => void;
		disabled?: boolean;
		class?: string;
	}

	let { activeMode, onSelect, disabled = false, class: className = '' }: Props = $props();

	const modes: { mode: AIMode; label: string; shortLabel: string; description: string }[] = [
		{
			mode: 'clarify',
			label: 'Clarify',
			shortLabel: 'Clarify',
			description: 'Simplify while preserving meaning'
		},
		{
			mode: 'alternatives',
			label: 'Alternatives',
			shortLabel: 'Alt',
			description: 'Different ways to say it'
		},
		{ mode: 'tone', label: 'Tone', shortLabel: 'Tone', description: 'Adjust emotional delivery' },
		{
			mode: 'expand',
			label: 'Go Deeper',
			shortLabel: 'Deep',
			description: 'Expand with more detail'
		},
		{
			mode: 'opening',
			label: 'Opening',
			shortLabel: 'Open',
			description: 'How to start your message'
		}
	];

	function handleSelect(mode: AIMode) {
		if (disabled) return;
		onSelect(mode);
	}
</script>

<div class="ai-mode-selector {className}" role="tablist" aria-label="AI mode selection">
	<div class="join w-full">
		{#each modes as { mode, label, shortLabel, description } (mode)}
			<button
				type="button"
				class="btn join-item flex-1 text-xs sm:text-sm {activeMode === mode
					? 'btn-primary'
					: 'btn-ghost'}"
				onclick={() => handleSelect(mode)}
				{disabled}
				role="tab"
				aria-selected={activeMode === mode}
				aria-label="{label}: {description}"
				title={description}
			>
				<!-- Short label on mobile, full on desktop -->
				<span class="hidden sm:inline">{label}</span>
				<span class="sm:hidden">{shortLabel}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.ai-mode-selector :global(.join) {
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.ai-mode-selector :global(.btn) {
		min-height: 2.5rem;
	}

	/* Ensure proper focus visibility for accessibility */
	.ai-mode-selector :global(.btn:focus-visible) {
		outline: 2px solid oklch(var(--p));
		outline-offset: 2px;
		z-index: 1;
	}
</style>
