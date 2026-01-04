<!--
  The Unsaid Logo Component
  A speech bubble with a heart inside - representing unspoken feelings becoming words
-->
<script lang="ts">
	interface Props {
		class?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		showGradient?: boolean;
	}

	let { class: className = '', size = 'md', showGradient = true }: Props = $props();

	const sizeClasses = {
		sm: 'h-5 w-5',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	// Generate unique ID for gradient to avoid conflicts when multiple logos are on page
	const gradientId = `unsaid-gradient-${Math.random().toString(36).slice(2, 9)}`;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 64 64"
	fill="none"
	class="{sizeClasses[size]} {className}"
	aria-hidden="true"
>
	{#if showGradient}
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#a855f7" />
				<stop offset="50%" stop-color="#8b5cf6" />
				<stop offset="100%" stop-color="#7c3aed" />
			</linearGradient>
		</defs>
	{/if}

	<!-- Speech bubble -->
	<path
		d="M32 6
		   C18 6 8 16 8 28
		   C8 40 18 48 28 48
		   L28 48
		   L20 58
		   L32 50
		   C32 50 32 50 32 50
		   C46 50 56 40 56 28
		   C56 16 46 6 32 6Z"
		fill={showGradient ? `url(#${gradientId})` : 'currentColor'}
	/>

	<!-- Heart inside -->
	<path
		d="M32 38
		   C32 38 22 30 22 24
		   C22 20 25 18 28 18
		   C30 18 32 20 32 22
		   C32 20 34 18 36 18
		   C39 18 42 20 42 24
		   C42 30 32 38 32 38Z"
		fill="white"
		fill-opacity="0.95"
	/>
</svg>
