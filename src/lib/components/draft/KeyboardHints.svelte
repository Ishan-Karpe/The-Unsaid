<!--
  KeyboardHints.svelte - Displays keyboard shortcuts
  Shows available shortcuts with platform-aware modifier keys
  Usage: <KeyboardHints />
-->
<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		/** Show in compact mode */
		compact?: boolean;
		/** Custom shortcuts to display */
		shortcuts?: { keys: string[]; description: string }[];
	}

	let { compact = false, shortcuts }: Props = $props();

	// Detect if user is on Mac
	let isMac = $derived(browser ? /Mac|iPod|iPhone|iPad/.test(navigator.platform) : false);

	// Default shortcuts
	const defaultShortcuts = [{ keys: ['mod', 'S'], description: 'Save' }];

	// Use provided shortcuts or defaults
	let displayShortcuts = $derived(shortcuts ?? defaultShortcuts);

	/**
	 * Format a key for display (replaces 'mod' with Cmd/Ctrl)
	 */
	function formatKey(key: string): string {
		if (key === 'mod') {
			return isMac ? 'Cmd' : 'Ctrl';
		}
		return key;
	}
</script>

{#if compact}
	<!-- Compact inline display -->
	<div class="inline-flex items-center gap-1 text-xs text-base-content/40">
		{#each displayShortcuts[0].keys as key, i (i)}
			<kbd class="kbd kbd-xs">{formatKey(key)}</kbd>
			{#if i < displayShortcuts[0].keys.length - 1}
				<span>+</span>
			{/if}
		{/each}
		<span class="ml-1">{displayShortcuts[0].description}</span>
	</div>
{:else}
	<!-- Full list display -->
	<div class="space-y-2">
		{#each displayShortcuts as shortcut (shortcut.description)}
			<div class="flex items-center justify-between text-sm">
				<span class="text-base-content/60">{shortcut.description}</span>
				<div class="flex items-center gap-1">
					{#each shortcut.keys as key, i (i)}
						<kbd class="kbd kbd-sm">{formatKey(key)}</kbd>
						{#if i < shortcut.keys.length - 1}
							<span class="text-base-content/40">+</span>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
