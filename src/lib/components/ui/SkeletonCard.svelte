<!--
  SkeletonCard.svelte - Skeleton loader for card-like content

  Provides a shimmer loading placeholder that matches card layouts.
  Useful for drafts, history items, and settings cards.

  Usage:
    <SkeletonCard />
    <SkeletonCard lines={3} showAvatar={true} />
-->
<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	interface Props {
		/** Number of text lines to show */
		lines?: number;
		/** Show avatar circle */
		showAvatar?: boolean;
		/** Show action buttons */
		showActions?: boolean;
		/** Custom class */
		class?: string;
	}

	let {
		lines = 2,
		showAvatar = false,
		showActions = false,
		class: className = ''
	}: Props = $props();
</script>

<div
	class="flex gap-4 rounded-lg border border-base-content/10 bg-base-100 p-4 {className}"
	role="status"
	aria-label="Loading content..."
>
	{#if showAvatar}
		<Skeleton class="h-12 w-12 shrink-0" rounded="full" />
	{/if}

	<div class="flex-1 space-y-3">
		<!-- Title line (wider) -->
		<Skeleton class="h-4 w-3/4" />

		<!-- Content lines -->
		{#each { length: lines - 1 } as _, i (i)}
			<Skeleton class="h-3" style="width: {Math.max(40, 100 - (i + 1) * 15)}%" />
		{/each}

		{#if showActions}
			<div class="mt-4 flex gap-2 pt-2">
				<Skeleton class="h-8 w-20" />
				<Skeleton class="h-8 w-16" />
			</div>
		{/if}
	</div>
</div>
