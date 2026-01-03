<!--
  OfflineIndicator.svelte - Shows offline status and reconnection state

  Displays a banner when the user is offline or reconnecting.
  Features:
  - Smooth animations for showing/hiding
  - Shows pending operations count
  - Acknowledges reconnection

  Usage:
    <OfflineIndicator />
-->
<script lang="ts">
	import { networkStore } from '$lib/stores/network.svelte';

	// Derived states
	let isOffline = $derived(!networkStore.isOnline);
	let isReconnecting = $derived(networkStore.status === 'reconnecting');
	let pendingOps = $derived(networkStore.pendingOperations);
	let wasRecentlyOffline = $derived(networkStore.wasRecentlyOffline);

	// Auto-dismiss reconnection notice after 3 seconds
	$effect(() => {
		if (wasRecentlyOffline && networkStore.isOnline && !isReconnecting) {
			const timer = setTimeout(() => {
				networkStore.acknowledgeReconnection();
			}, 3000);

			return () => clearTimeout(timer);
		}
	});
</script>

{#if isOffline || isReconnecting || wasRecentlyOffline}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:w-80"
		role="status"
		aria-live="polite"
	>
		<div
			class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300
				{isOffline
				? 'border-error/30 bg-error/10'
				: isReconnecting
					? 'border-warning/30 bg-warning/10'
					: 'border-success/30 bg-success/10'}"
		>
			<!-- Status Icon -->
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
					{isOffline ? 'bg-error/20' : isReconnecting ? 'bg-warning/20' : 'bg-success/20'}"
			>
				{#if isOffline}
					<!-- Offline icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 text-error"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
						/>
					</svg>
				{:else if isReconnecting}
					<!-- Reconnecting spinner -->
					<span class="loading loading-sm loading-spinner text-warning"></span>
				{:else}
					<!-- Online check icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 text-success"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</div>

			<!-- Status Text -->
			<div class="flex-1">
				<p
					class="text-sm font-medium
						{isOffline ? 'text-error' : isReconnecting ? 'text-warning' : 'text-success'}"
				>
					{#if isOffline}
						You're offline
					{:else if isReconnecting}
						Reconnecting...
					{:else}
						Back online!
					{/if}
				</p>

				<p class="text-xs text-base-content/60">
					{#if isOffline}
						{#if pendingOps > 0}
							{pendingOps} change{pendingOps === 1 ? '' : 's'} will sync when connected
						{:else}
							Changes will be saved when you reconnect
						{/if}
					{:else if isReconnecting}
						Syncing your changes...
					{:else if pendingOps > 0}
						Synced {pendingOps} change{pendingOps === 1 ? '' : 's'}
					{:else}
						All changes synced
					{/if}
				</p>
			</div>

			<!-- Dismiss button (only when reconnected) -->
			{#if !isOffline && !isReconnecting && wasRecentlyOffline}
				<button
					type="button"
					onclick={() => networkStore.acknowledgeReconnection()}
					class="btn btn-circle btn-ghost btn-xs"
					aria-label="Dismiss notification"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}
