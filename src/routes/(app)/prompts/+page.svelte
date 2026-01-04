<!--
  Prompts Library Page - Curated conversation starters organized by relationship
  Features: Category filtering, search, recently used, elegant animations
  Matches the landing page design language with DaisyUI and Tailwind CSS
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { RelationshipCategory, ConversationPrompt } from '$lib/types';
	import {
		getAllPrompts,
		getPromptsByRelationship,
		markPromptAsUsed,
		getSavedPrompts,
		relationshipLabels,
		relationshipDescriptions
	} from '$lib/data/prompts';
	import {
		PromptCard,
		CategoryFilter,
		PromptSearch,
		RecentlyUsed,
		SuggestPromptForm
	} from '$lib/components/prompts';
	import { toastStore } from '$lib/stores/toast.svelte';

	// Animation states
	let headerVisible = $state(false);
	let searchVisible = $state(false);
	let filtersVisible = $state(false);
	let cardsVisible = $state(false);
	let savedVisible = $state(false);

	// Filter state
	let searchQuery = $state('');
	let selectedCategory = $state<RelationshipCategory | 'all'>('all');

	// Form state
	let showSuggestForm = $state(false);
	let savedPrompts = $state<ConversationPrompt[]>([]);
	let isMounted = $state(false);

	// Filtered prompts based on category and search
	let filteredPrompts = $derived.by(() => {
		let results: ConversationPrompt[];

		// Apply category filter first
		if (selectedCategory === 'all') {
			results = getAllPrompts();
		} else {
			results = getPromptsByRelationship(selectedCategory);
		}

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter(
				(p) =>
					p.text.toLowerCase().includes(query) ||
					p.relationship.toLowerCase().includes(query) ||
					p.situation.toLowerCase().includes(query) ||
					(p.emotion && p.emotion.toLowerCase().includes(query))
			);
		}

		return results;
	});

	// Group prompts by relationship for display (only when showing all and not searching)
	let groupedPrompts = $derived.by(() => {
		if (selectedCategory !== 'all' || searchQuery.trim()) {
			// Don't group when filtering
			return null;
		}

		// Group by relationship
		const groups: Record<RelationshipCategory, ConversationPrompt[]> = {
			parents: [],
			partners: [],
			friends: [],
			grief: [],
			self: []
		};

		for (const prompt of filteredPrompts) {
			groups[prompt.relationship].push(prompt);
		}

		return groups;
	});

	// Categories with prompts count for display
	const relationshipOrder: RelationshipCategory[] = [
		'parents',
		'partners',
		'friends',
		'grief',
		'self'
	];

	onMount(() => {
		isMounted = true;
		refreshSaved();
		// Staggered entrance animations
		setTimeout(() => (headerVisible = true), 100);
		setTimeout(() => (searchVisible = true), 200);
		setTimeout(() => (filtersVisible = true), 300);
		setTimeout(() => (cardsVisible = true), 400);
		setTimeout(() => (savedVisible = true), 350);

		if (typeof window !== 'undefined') {
			window.addEventListener('prompt-saved', handleSavedEvent);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('prompt-saved', handleSavedEvent);
		}
	});

	function handleSearch(query: string) {
		searchQuery = query;
	}

	function handleCategorySelect(category: RelationshipCategory | 'all') {
		selectedCategory = category;
	}

	function refreshSaved() {
		if (!isMounted) return;
		savedPrompts = getSavedPrompts();
	}

	function handleSavedEvent() {
		refreshSaved();
	}

	function handleUsePrompt(promptId: string) {
		// Mark as recently used
		markPromptAsUsed(promptId);

		// Dispatch event for RecentlyUsed component to refresh
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('prompt-used'));
		}

		// Show toast
		toastStore.success('Prompt selected! Redirecting to editor...');

		// Navigate to write page with prompt
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query string requires manual construction
		goto(`${resolve('/write')}?prompt=${promptId}`);
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
	}

	function handleSuggestSubmit() {
		toastStore.success('Thank you for your suggestion!');
	}
</script>

<svelte:head>
	<title>Conversation Prompts | The Unsaid</title>
	<meta
		name="description"
		content="Curated conversation starters to help you express what matters most."
	/>
</svelte:head>

<div class="space-y-8 pb-12">
	<!-- Header Section -->
	<div class="fade-in text-center {headerVisible ? 'visible' : ''}">
		<h1 class="text-3xl leading-tight font-bold tracking-tight text-base-content md:text-4xl">
			Phrase Library
		</h1>
		<p class="mt-2 text-lg text-primary italic md:text-xl">Words for every emotion</p>
		<p class="text-muted mx-auto mt-4 max-w-2xl">
			A curated collection of expressions to help you communicate with clarity, depth, and
			intention.
		</p>
	</div>

	<!-- Search Bar -->
	<div class="fade-in stagger-1 {searchVisible ? 'visible' : ''}">
		<div class="mx-auto max-w-2xl">
			<PromptSearch query={searchQuery} onSearch={handleSearch} />
		</div>
	</div>

	<!-- Category Filters -->
	<div class="fade-in stagger-2 {filtersVisible ? 'visible' : ''}">
		<CategoryFilter selected={selectedCategory} onSelect={handleCategorySelect} />
	</div>

	<!-- Recently Used Section (only when not filtering) -->
	{#if !searchQuery && selectedCategory === 'all'}
		{#if savedPrompts.length > 0}
			<div class="fade-in {savedVisible ? 'visible' : ''}">
				<div class="mb-4 flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-primary"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v16l-5-2.5L5 19V3z" />
					</svg>
					<h2 class="text-lg font-semibold text-base-content">Saved</h2>
					<span class="badge badge-ghost badge-sm">{savedPrompts.length}</span>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each savedPrompts as prompt (prompt.id)}
						<PromptCard {prompt} onUse={handleUsePrompt} showRelationship={true} />
					{/each}
				</div>
			</div>
		{/if}
		<RecentlyUsed onUse={handleUsePrompt} />
	{/if}

	<!-- Prompts Display -->
	<div class="fade-in stagger-3 {cardsVisible ? 'visible' : ''}">
		{#if filteredPrompts.length === 0}
			<!-- Empty State -->
			<div class="card mx-auto max-w-md border border-base-content/10 bg-base-200/50 shadow-lg">
				<div class="card-body items-center py-12 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-4 h-16 w-16 text-base-content/20"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clip-rule="evenodd"
						/>
					</svg>
					<h3 class="mb-2 text-lg font-semibold text-base-content/80">No prompts found</h3>
					<p class="mb-4 text-base-content/60">Try adjusting your search or category filter.</p>
					<button type="button" class="btn btn-ghost btn-sm" onclick={clearFilters}>
						Clear Filters
					</button>
				</div>
			</div>
		{:else if groupedPrompts}
			<!-- Grouped by Category View -->
			{#each relationshipOrder as category (category)}
				{@const prompts = groupedPrompts[category]}
				{#if prompts.length > 0}
					<div class="mb-8">
						<!-- Category Header -->
						<div class="mb-4 flex items-center gap-3">
							<h2 class="text-xl font-semibold text-base-content">
								{relationshipLabels[category]}
							</h2>
							<span class="badge badge-ghost">{prompts.length} prompts</span>
						</div>
						<p class="mb-4 text-sm text-base-content/60">
							{relationshipDescriptions[category]}
						</p>

						<!-- Prompts Grid with Add New Card -->
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							<!-- Add New Phrase Card (only on first category) -->
							{#if category === 'parents'}
								<button
									type="button"
									onclick={() => (showSuggestForm = true)}
									class="card flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-primary/30 bg-base-200/30 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-base-200/50"
								>
									<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-6 w-6 text-primary"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
											<path
												fill-rule="evenodd"
												d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<div>
										<h3 class="font-semibold text-base-content">Add New Phrase</h3>
										<p class="mt-1 text-sm text-base-content/60">
											Contribute your own expressions to your personal library.
										</p>
									</div>
									<span class="btn btn-outline btn-sm btn-primary">Create Phrase</span>
								</button>
							{/if}
							{#each prompts as prompt (prompt.id)}
								<PromptCard {prompt} onUse={handleUsePrompt} showRelationship={false} />
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		{:else}
			<!-- Flat List View (when filtering) -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredPrompts as prompt (prompt.id)}
					<PromptCard {prompt} onUse={handleUsePrompt} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Suggest Prompt Button (fixed bottom right on mobile) -->
<div class="fixed right-4 bottom-6 z-40 lg:hidden">
	<button
		type="button"
		class="btn btn-circle shadow-lg btn-lg btn-primary"
		onclick={() => (showSuggestForm = true)}
		aria-label="Suggest a prompt"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>
</div>

<!-- Suggest Prompt Modal -->
<SuggestPromptForm
	open={showSuggestForm}
	onClose={() => (showSuggestForm = false)}
	onSubmit={handleSuggestSubmit}
/>

<style>
	/* Fade-in animations matching other pages */
	.fade-in {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.stagger-1 {
		transition-delay: 0.1s;
	}

	.stagger-2 {
		transition-delay: 0.2s;
	}

	.stagger-3 {
		transition-delay: 0.3s;
	}
</style>
