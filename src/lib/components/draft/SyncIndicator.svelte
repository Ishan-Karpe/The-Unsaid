<!--
  SyncIndicator.svelte - Shows save status
  Displays: Saved, Saving..., Unsaved Changes, Error
  Usage: <SyncIndicator />
-->
<script lang="ts">
	import { draftStore } from '$lib/stores/draft.svelte';
	import { isE2E } from '$lib/services/e2eStorage';

	const statusConfig = {
		saved: { text: 'Saved', class: 'badge-ghost', icon: '✓' },
		saving: { text: 'Saving...', class: 'badge-info', icon: '↻' },
		offline: { text: 'Offline', class: 'badge-warning', icon: '○' },
		error: { text: 'Error', class: 'badge-error', icon: '!' }
	};

	let config = $derived(statusConfig[draftStore.syncStatus.state]);
	let showUnsaved = $derived(draftStore.isDirty && draftStore.syncStatus.state === 'saved');
	let unsavedLabel = $derived(isE2E ? 'Unsynced' : 'Unsaved');

	// Check if the error is due to missing encryption key
	let isKeyError = $derived(
		draftStore.syncStatus.state === 'error' &&
			draftStore.syncStatus.message?.includes('Encryption key')
	);

	// Get error message for display
	let errorMessage = $derived(
		draftStore.syncStatus.state === 'error' ? draftStore.syncStatus.message : null
	);

	// Get retry function if available
	let retryFn = $derived(
		draftStore.syncStatus.state === 'error' ? draftStore.syncStatus.retry : null
	);

	function handleRelogin() {
		// Redirect to login page to re-establish encryption key
		window.location.href = '/login';
	}
</script>

<div class="flex items-center gap-2 text-sm">
	{#if showUnsaved}
		<span class="badge badge-sm badge-warning">
			<span class="mr-1">●</span>
			{unsavedLabel}
		</span>
	{:else if draftStore.syncStatus.state === 'error'}
		<div class="flex items-center gap-2">
			<span class="badge badge-sm badge-error" title={errorMessage || 'Save failed'}>
				<span class="mr-1">!</span>
				{#if isKeyError}
					Session expired
				{:else}
					Error
				{/if}
			</span>
			{#if isKeyError}
				<button type="button" class="btn text-error btn-ghost btn-xs" onclick={handleRelogin}>
					Re-login
				</button>
			{:else if retryFn}
				<button type="button" class="btn btn-ghost btn-xs" onclick={retryFn}> Retry </button>
			{/if}
		</div>
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
