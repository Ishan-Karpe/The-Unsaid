<!--
  SyncIndicator.svelte - Shows save status
  Displays: Saved, Saving..., Unsaved Changes, Error
  Usage: <SyncIndicator />
-->
<script lang="ts">
	import { draftStore } from '$lib/stores/draft.svelte';

	const statusConfig = {
		saved: { text: 'Saved', class: 'badge-ghost', icon: '✓' },
		saving: { text: 'Saving...', class: 'badge-info', icon: '↻' },
		offline: { text: 'Offline', class: 'badge-warning', icon: '○' },
		error: { text: 'Error', class: 'badge-error', icon: '!' }
	};

	let config = $derived(statusConfig[draftStore.syncStatus.state]);
	let showUnsaved = $derived(draftStore.isDirty && draftStore.syncStatus.state === 'saved');
</script>

<div class="flex items-center gap-2 text-sm">
	{#if showUnsaved}
		<span class="badge badge-warning badge-sm">
			<span class="mr-1">●</span>
			Unsaved
		</span>
	{:else}
		<span class="badge {config.class} badge-sm">
			<span class="mr-1">{config.icon}</span>
			{config.text}
		</span>
	{/if}

	{#if draftStore.syncStatus.state === 'saved' && !draftStore.isDirty}
		<span class="text-xs text-base-content/50">
			{draftStore.syncStatus.lastSync.toLocaleTimeString()}
		</span>
	{/if}
</div>
