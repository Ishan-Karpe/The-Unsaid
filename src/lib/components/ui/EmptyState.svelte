<!--
  EmptyState.svelte - Placeholder for empty content states

  Displays a friendly message when there's no content to show.
  Used for empty history, empty trash, no search results, etc.

  Usage:
    <EmptyState
      title="No drafts yet"
      description="Start writing to see your drafts here"
      actionLabel="Start Writing"
      onAction={() => goto('/write')}
    />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Title text */
		title: string;
		/** Description text */
		description?: string;
		/** Icon type */
		icon?: 'empty' | 'search' | 'trash' | 'offline' | 'error' | 'ai';
		/** Primary action button label */
		actionLabel?: string;
		/** Primary action callback */
		onAction?: () => void;
		/** Secondary action label */
		secondaryLabel?: string;
		/** Secondary action callback */
		onSecondary?: () => void;
		/** Custom icon slot */
		customIcon?: Snippet;
		/** Additional classes */
		class?: string;
	}

	let {
		title,
		description,
		icon = 'empty',
		actionLabel,
		onAction,
		secondaryLabel,
		onSecondary,
		customIcon,
		class: className = ''
	}: Props = $props();

	// Icon SVG paths
	const icons = {
		empty: {
			viewBox: '0 0 24 24',
			path: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z',
			fill: true
		},
		search: {
			viewBox: '0 0 24 24',
			path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
			fill: false
		},
		trash: {
			viewBox: '0 0 24 24',
			path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
			fill: false
		},
		offline: {
			viewBox: '0 0 24 24',
			path: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414',
			fill: false
		},
		error: {
			viewBox: '0 0 24 24',
			path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
			fill: false
		},
		ai: {
			viewBox: '0 0 24 24',
			path: 'M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z',
			fill: true
		}
	};

	// Get current icon reactively
	let currentIcon = $derived(icons[icon]);
</script>

<div
	class="flex flex-col items-center justify-center px-4 py-12 text-center {className}"
	role="status"
>
	<!-- Icon -->
	<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
		{#if customIcon}
			{@render customIcon()}
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8 text-base-content/40"
				viewBox={currentIcon.viewBox}
				fill={currentIcon.fill ? 'currentColor' : 'none'}
				stroke={currentIcon.fill ? 'none' : 'currentColor'}
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d={currentIcon.path} />
			</svg>
		{/if}
	</div>

	<!-- Title -->
	<h3 class="mb-2 text-lg font-semibold text-base-content">
		{title}
	</h3>

	<!-- Description -->
	{#if description}
		<p class="mb-6 max-w-sm text-sm text-base-content/60">
			{description}
		</p>
	{/if}

	<!-- Actions -->
	{#if actionLabel || secondaryLabel}
		<div class="flex flex-wrap gap-3">
			{#if actionLabel && onAction}
				<button type="button" onclick={onAction} class="btn btn-primary">
					{actionLabel}
				</button>
			{/if}

			{#if secondaryLabel && onSecondary}
				<button type="button" onclick={onSecondary} class="btn btn-ghost">
					{secondaryLabel}
				</button>
			{/if}
		</div>
	{/if}
</div>
