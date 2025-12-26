<!--
  Phrase Library Page - Curated conversation starters with elegant animations
  Matches the landing page design language with DaisyUI and Tailwind CSS
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { phrasePrompts, categoryLabels, formatUses } from '$lib/data/prompts';
	import type { PromptCategory } from '$lib/types';

	// Animation states
	let headerVisible = $state(false);
	let searchVisible = $state(false);
	let categoriesVisible = $state(false);
	let cardsVisible = $state(false);

	// Filter state
	let searchQuery = $state('');
	let selectedCategory = $state<PromptCategory | 'all'>('all');

	// Bookmark state (local storage)
	let bookmarkedIds = new SvelteSet<string>();

	// Get all categories from the prompts
	const categories: PromptCategory[] = [
		'gratitude',
		'apologies',
		'empathy',
		'boundaries',
		'self-love'
	];

	// Category colors for badges
	const categoryColors: Record<PromptCategory, string> = {
		gratitude: 'badge-primary',
		apologies: 'badge-secondary',
		empathy: 'badge-accent',
		boundaries: 'badge-warning',
		'self-love': 'badge-info'
	};

	// Pre-resolve the write path
	const writePath = resolve('/write');

	// Filtered prompts based on search and category
	let filteredPrompts = $derived(() => {
		let prompts =
			selectedCategory === 'all'
				? phrasePrompts
				: phrasePrompts.filter((p) => p.category === selectedCategory);

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			prompts = prompts.filter(
				(p) =>
					p.text.toLowerCase().includes(query) ||
					p.title.toLowerCase().includes(query) ||
					categoryLabels[p.category].toLowerCase().includes(query)
			);
		}

		return prompts;
	});

	onMount(() => {
		// Staggered animations
		setTimeout(() => (headerVisible = true), 100);
		setTimeout(() => (searchVisible = true), 200);
		setTimeout(() => (categoriesVisible = true), 300);
		setTimeout(() => (cardsVisible = true), 400);

		// Load bookmarks from localStorage
		try {
			const saved = localStorage.getItem('unsaid-bookmarks');
			if (saved) {
				const ids = JSON.parse(saved) as string[];
				for (const id of ids) {
					bookmarkedIds.add(id);
				}
			}
		} catch {
			// Ignore localStorage errors
		}
	});

	function toggleBookmark(id: string) {
		if (bookmarkedIds.has(id)) {
			bookmarkedIds.delete(id);
		} else {
			bookmarkedIds.add(id);
		}

		// Persist to localStorage
		try {
			localStorage.setItem('unsaid-bookmarks', JSON.stringify([...bookmarkedIds]));
		} catch {
			// Ignore localStorage errors
		}
	}
</script>

<svelte:head>
	<title>Phrase Library | The Unsaid</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header Section -->
	<div class="fade-in text-center {headerVisible ? 'visible' : ''}">
		<h1 class="text-3xl font-bold text-base-content md:text-4xl">Phrase Library</h1>
		<p class="mt-2 font-serif text-xl text-primary italic md:text-2xl">Words for every emotion</p>
		<p class="mx-auto mt-4 max-w-2xl text-base-content/70">
			A curated collection of expressions to help you communicate with clarity, depth, and
			intention.
		</p>
	</div>

	<!-- Search Bar -->
	<div class="fade-in stagger-1 {searchVisible ? 'visible' : ''}">
		<div class="mx-auto max-w-2xl">
			<div
				class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
			>
				<div class="card-body p-3">
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-base-content/40"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
									clip-rule="evenodd"
								/>
							</svg>
							<input
								type="search"
								bind:value={searchQuery}
								placeholder="Search for 'gratitude', 'apology', or keywords..."
								class="input-bordered input w-full bg-base-200/50 pl-10 transition-all duration-200 focus:bg-base-100"
							/>
						</div>
						<button
							type="button"
							class="btn shadow-sm transition-all duration-200 btn-primary hover:shadow-md hover:shadow-primary/25"
						>
							Find Phrase
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Category Filters -->
	<div class="fade-in stagger-2 {categoriesVisible ? 'visible' : ''}">
		<div class="flex flex-wrap justify-center gap-2">
			<button
				type="button"
				class="btn transition-all duration-200 {selectedCategory === 'all'
					? 'btn-primary'
					: 'btn-ghost hover:bg-base-200'}"
				onclick={() => (selectedCategory = 'all')}
			>
				All Phrases
			</button>
			{#each categories as cat (cat)}
				<button
					type="button"
					class="btn transition-all duration-200 {selectedCategory === cat
						? 'btn-primary'
						: 'btn-ghost hover:bg-base-200'}"
					onclick={() => (selectedCategory = cat)}
				>
					{categoryLabels[cat]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Phrase Cards Grid -->
	<div class="fade-in stagger-3 {cardsVisible ? 'visible' : ''}">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<!-- Add New Phrase Card -->
			<div
				class="group card border-2 border-dashed border-base-content/20 bg-base-100/50 transition-all duration-300 hover:border-primary/50 hover:bg-base-100"
			>
				<div class="card-body items-center justify-center py-12 text-center">
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 text-primary"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
							/>
							<path d="M8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
							<path d="M9 8a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-base-content">Add New Phrase</h3>
					<p class="mt-1 text-sm text-base-content/60">
						Contribute your own expressions to your personal library.
					</p>
					<a
						href={writePath}
						class="btn mt-4 shadow-sm transition-all duration-200 btn-outline btn-sm btn-primary hover:shadow-md"
					>
						Create Phrase
					</a>
				</div>
			</div>

			<!-- Phrase Cards -->
			{#each filteredPrompts() as prompt, index (prompt.id)}
				<div
					class="card-hover card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300"
					style="animation-delay: {(index + 1) * 50}ms"
				>
					<div class="card-body gap-3 p-5">
						<!-- Category Badge & Bookmark -->
						<div class="flex items-start justify-between">
							<span class="badge badge-sm {categoryColors[prompt.category]}">
								{categoryLabels[prompt.category].toUpperCase()}
							</span>
							<button
								type="button"
								class="btn btn-circle btn-ghost transition-all duration-200 btn-xs hover:bg-primary/10"
								onclick={() => toggleBookmark(prompt.id)}
								aria-label={bookmarkedIds.has(prompt.id) ? 'Remove bookmark' : 'Add bookmark'}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {bookmarkedIds.has(prompt.id)
										? 'fill-primary text-primary'
										: 'text-base-content/40'}"
									viewBox="0 0 20 20"
									fill={bookmarkedIds.has(prompt.id) ? 'currentColor' : 'none'}
									stroke="currentColor"
									stroke-width="1.5"
								>
									<path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
								</svg>
							</button>
						</div>

						<!-- Title -->
						<h3 class="text-lg font-semibold text-base-content">
							{prompt.title}
						</h3>

						<!-- Quote Preview -->
						<blockquote
							class="border-l-3 border-primary/30 pl-4 leading-relaxed text-base-content/70 italic"
						>
							"{prompt.text}"
						</blockquote>

						<!-- Footer with Uses and Action -->
						<div class="mt-auto flex items-center justify-between pt-2">
							<div class="flex items-center gap-1 text-xs text-base-content/40">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3.5 w-3.5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
									/>
								</svg>
								<span>{formatUses(prompt.uses)}</span>
							</div>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is pre-resolved -->
							<a
								href="{writePath}?prompt={prompt.id}"
								class="btn shadow-sm transition-all duration-200 btn-sm btn-primary hover:shadow-md hover:shadow-primary/25"
							>
								Use Phrase
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Empty State -->
		{#if filteredPrompts().length === 0}
			<div
				class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300"
			>
				<div class="card-body items-center py-16 text-center">
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
					<h3 class="mb-2 text-lg font-semibold text-base-content/80">No phrases found</h3>
					<p class="mb-4 text-base-content/60">Try adjusting your search or category filter.</p>
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onclick={() => {
							searchQuery = '';
							selectedCategory = 'all';
						}}
					>
						Clear Filters
					</button>
				</div>
			</div>
		{/if}

		<!-- Load More Button -->
		{#if filteredPrompts().length > 0}
			<div class="mt-8 text-center">
				<button
					type="button"
					class="btn btn-wide gap-2 shadow-sm transition-all duration-300 btn-outline hover:shadow-md"
				>
					Load More Phrases
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		{/if}
	</div>
</div>

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

	/* Card list entrance animation */
	.card {
		animation: cardFadeIn 0.4s ease-out forwards;
		opacity: 0;
	}

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Blockquote styling */
	blockquote {
		border-left-width: 3px;
	}
</style>
