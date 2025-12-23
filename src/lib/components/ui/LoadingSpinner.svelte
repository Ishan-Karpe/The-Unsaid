<!--
  LoadingSpinner.svelte - DaisyUI loading spinner component
  Usage: <LoadingSpinner size="md" />
-->
<script lang="ts">
	type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		size?: SpinnerSize;
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();
</script>

<span class="loading loading-spinner loading-{size} {className}"></span>
