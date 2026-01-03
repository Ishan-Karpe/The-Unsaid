<!--
  SkeletonList.svelte - Skeleton loader for list-like content

  Renders multiple skeleton items for lists and grids.
  Automatically handles different layouts.

  Usage:
    <SkeletonList count={5} />
    <SkeletonList count={3} variant="card" />
-->
<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import SkeletonCard from './SkeletonCard.svelte';

	interface Props {
		/** Number of items to show */
		count?: number;
		/** Variant type */
		variant?: 'simple' | 'card' | 'compact';
		/** Gap between items */
		gap?: 'sm' | 'md' | 'lg';
		/** Custom class */
		class?: string;
	}

	let { count = 3, variant = 'simple', gap = 'md', class: className = '' }: Props = $props();

	const gapClasses = {
		sm: 'gap-2',
		md: 'gap-4',
		lg: 'gap-6'
	};

	// Generate stable keys
	const items = $derived(Array.from({ length: count }, (_, i) => i));
</script>

<div class="flex flex-col {gapClasses[gap]} {className}" role="status" aria-label="Loading list...">
	{#each items as i (i)}
		{#if variant === 'card'}
			<SkeletonCard lines={2} showAvatar={i % 2 === 0} />
		{:else if variant === 'compact'}
			<div class="flex items-center gap-3 py-2">
				<Skeleton class="h-8 w-8" rounded="full" />
				<div class="flex-1 space-y-2">
					<Skeleton class="h-3 w-1/2" />
					<Skeleton class="h-2 w-1/3" />
				</div>
			</div>
		{:else}
			<!-- Simple variant -->
			<div class="space-y-2">
				<Skeleton class="h-4" style="width: {80 - i * 5}%" />
				<Skeleton class="h-3" style="width: {60 - i * 10}%" />
			</div>
		{/if}
	{/each}

	<span class="sr-only">Loading {count} items...</span>
</div>
