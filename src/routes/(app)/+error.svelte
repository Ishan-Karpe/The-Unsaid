<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { networkStore } from '$lib/stores/network.svelte';

	let status = $derived($page.status);
	let error = $derived($page.error);

	let isOffline = $derived(!networkStore.isOnline);
	let statusLabel = $derived(status ? `Error ${status}` : 'Something went wrong');
	let showDetails = $derived(import.meta.env.DEV);
	let errorMessage = $derived(
		error instanceof Error ? error.message : error ? String(error) : 'Unknown error'
	);
</script>

<section class="page-container py-10">
	<div class="mx-auto max-w-2xl">
		<div class="card bg-base-100 shadow-lg card-border">
			<div class="card-body items-center gap-4 text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-warning"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>

				<div class="space-y-2">
					<h1 class="text-2xl font-semibold tracking-tight">{statusLabel}</h1>
					<p class="text-base-content/60">
						We couldn't load this area. Your drafts are safe. Try again or head back to writing.
					</p>
				</div>

				{#if isOffline}
					<div class="alert text-sm alert-warning">
						<span>You're offline. Reconnect to restore your workspace.</span>
					</div>
				{/if}

				{#if showDetails && errorMessage}
					<details
						class="w-full rounded-lg border border-base-content/10 bg-base-200/40 p-3 text-left"
					>
						<summary class="cursor-pointer text-sm font-medium text-base-content/70">
							Error details
						</summary>
						<code class="mt-2 block text-xs break-words text-base-content/70">{errorMessage}</code>
					</details>
				{/if}

				<div class="flex flex-wrap justify-center gap-2">
					<a href={resolve('/write')} class="btn-cta btn btn-primary">Back to Writing</a>
					<a href={resolve('/history')} class="btn btn-ghost">History</a>
					<button type="button" class="btn btn-outline" onclick={() => window.location.reload()}>
						Reload
					</button>
				</div>
			</div>
		</div>
	</div>
</section>
