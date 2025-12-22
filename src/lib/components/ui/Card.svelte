<!--
  Card.svelte - Reusable card component with DaisyUI styling
  Usage: <Card title="My Card"><p>Content here</p></Card>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		compact?: boolean;
		bordered?: boolean;
		class?: string;
		children: Snippet;
		actions?: Snippet;
	}

	let {
		title,
		subtitle,
		compact = false,
		bordered = false,
		class: className = '',
		children,
		actions
	}: Props = $props();
</script>

<div class="card bg-base-100 {bordered ? 'border border-base-300' : 'shadow-md'} {className}">
	<div class="card-body {compact ? 'p-4' : ''}">
		{#if title}
			<h2 class="card-title">{title}</h2>
		{/if}

		{#if subtitle}
			<p class="text-base-content/70 text-sm">{subtitle}</p>
		{/if}

		{@render children()}

		{#if actions}
			<div class="card-actions justify-end mt-4">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
