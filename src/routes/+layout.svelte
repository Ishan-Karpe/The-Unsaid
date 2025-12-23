<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Turn feelings into words. The Unsaid helps you express important things to people who matter most."
	/>
	<meta name="theme-color" content="#6366f1" />
</svelte:head>

<!-- App shell with theme support -->
<div class="min-h-screen bg-base-100 text-base-content">
	{@render children()}
</div>
