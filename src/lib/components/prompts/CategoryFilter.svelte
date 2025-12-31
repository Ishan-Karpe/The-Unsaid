<!--
  CategoryFilter.svelte - Filter prompts by relationship category
  A horizontal filter bar with pill-shaped buttons for selecting relationship categories
  Usage: <CategoryFilter selected={category} onSelect={(c) => {}} />
-->
<script lang="ts">
	import type { RelationshipCategory } from '$lib/types';
	import { relationshipLabels, relationshipDescriptions } from '$lib/data/prompts';

	interface Props {
		selected: RelationshipCategory | 'all';
		onSelect: (category: RelationshipCategory | 'all') => void;
		disabled?: boolean;
		class?: string;
	}

	let { selected, onSelect, disabled = false, class: className = '' }: Props = $props();

	const categories: (RelationshipCategory | 'all')[] = [
		'all',
		'parents',
		'partners',
		'friends',
		'grief',
		'self'
	];

	function getLabel(category: RelationshipCategory | 'all'): string {
		return category === 'all' ? 'All Phrases' : relationshipLabels[category];
	}

	function getDescription(category: RelationshipCategory | 'all'): string {
		return category === 'all' ? 'Show all prompts' : relationshipDescriptions[category];
	}
</script>

<div class="category-filter {className}" role="tablist" aria-label="Filter by relationship">
	<div class="flex flex-wrap justify-center gap-2">
		{#each categories as category (category)}
			<button
				type="button"
				class="rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 {selected ===
				category
					? 'bg-primary text-primary-content shadow-lg shadow-primary/25'
					: 'border border-base-content/20 bg-base-200/50 text-base-content/70 hover:border-primary/50 hover:text-base-content'}"
				onclick={() => onSelect(category)}
				{disabled}
				role="tab"
				aria-selected={selected === category}
				title={getDescription(category)}
			>
				{getLabel(category)}
			</button>
		{/each}
	</div>
</div>
