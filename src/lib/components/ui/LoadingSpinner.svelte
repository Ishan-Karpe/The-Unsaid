<!--
  LoadingSpinner.svelte - DaisyUI loading spinner component
  Usage: <LoadingSpinner size="md" />
-->
<script lang="ts">
	type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		size?: SpinnerSize;
		class?: string;
		label?: string;
	}

	let { size = 'md', class: className = '', label = 'Loading' }: Props = $props();
</script>

<span
	class="loading loading-spinner loading-{size} transition-opacity duration-200 {className}"
	role="status"
	aria-label={label}
></span>
