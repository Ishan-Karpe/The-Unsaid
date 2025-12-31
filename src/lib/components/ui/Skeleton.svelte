<!--
  Skeleton.svelte - Loading placeholder component
  Provides accessible loading state indicators with animation
  Usage: <Skeleton class="h-24 w-full" />
-->
<script lang="ts">
	interface Props {
		class?: string;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
	}

	let { class: className = '', rounded = 'md' }: Props = $props();

	const roundedClasses: Record<typeof rounded, string> = {
		none: '',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
</script>

<div
	class="skeleton animate-pulse bg-base-300 {roundedClasses[rounded]} {className}"
	role="status"
	aria-label="Loading..."
>
	<span class="sr-only">Loading...</span>
</div>
