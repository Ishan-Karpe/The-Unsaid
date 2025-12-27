<!--
  History Page - View and manage past drafts with pagination, filters, and trash
  Matches the landing page design language with DaisyUI and Tailwind CSS
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { draftService } from '$lib/services';
	import { draftStore } from '$lib/stores/draft.svelte';
	import {
		FilterPanel,
		DraftPreview,
		TrashView,
		FirstUseWelcome,
		ProgressBar
	} from '$lib/components';
	import type { Draft, DateRange } from '$lib/types';

	// Animation states
	let headerVisible = $state(false);
	let filtersVisible = $state(false);
	let listVisible = $state(false);

	// Data state
	let drafts = $state<Draft[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);

	// Pagination state
	const PAGE_SIZE = 20;
	let offset = $state(0);
	let totalDrafts = $state(0);
	let hasMore = $state(false);

	// Filter state
	let searchQuery = $state('');
	let selectedRecipient = $state('');
	let sortBy = $state<'updated' | 'created'>('updated');
	let dateRange = $state<DateRange>({ start: null, end: null });

	// Trash view state
	let showTrash = $state(false);

	// Delete confirmation
	let deletingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);

	// Computed values
	let uniqueRecipients = $derived(
		[...new Set(drafts.map((d) => d.recipient).filter(Boolean))].sort()
	);

	let filteredDrafts = $derived.by(() => {
		let result = [...drafts];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(d) =>
					d.content.toLowerCase().includes(query) ||
					d.recipient?.toLowerCase().includes(query) ||
					d.intent?.toLowerCase().includes(query)
			);
		}

		// Filter by recipient
		if (selectedRecipient) {
			result = result.filter((d) => d.recipient === selectedRecipient);
		}

		// Filter by date range
		if (dateRange.start) {
			result = result.filter((d) => {
				const draftDate = sortBy === 'updated' ? d.updatedAt : d.createdAt;
				return draftDate && draftDate >= dateRange.start!;
			});
		}
		if (dateRange.end) {
			// Add one day to include the end date fully
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date used in function, not reactive state
			const endOfDay = new Date(dateRange.end);
			endOfDay.setHours(23, 59, 59, 999);
			result = result.filter((d) => {
				const draftDate = sortBy === 'updated' ? d.updatedAt : d.createdAt;
				return draftDate && draftDate <= endOfDay;
			});
		}

		// Sort
		result.sort((a, b) => {
			const dateA = sortBy === 'updated' ? a.updatedAt : a.createdAt;
			const dateB = sortBy === 'updated' ? b.updatedAt : b.createdAt;
			return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
		});

		return result;
	});

	onMount(() => {
		// Staggered animations
		setTimeout(() => (headerVisible = true), 100);
		setTimeout(() => (filtersVisible = true), 200);
		setTimeout(() => (listVisible = true), 300);

		// Load drafts
		loadDrafts();

		// Listen for encryption key restoration
		const handleKeyRestored = () => {
			offset = 0;
			drafts = [];
			loadDrafts();
		};
		window.addEventListener('encryption-key-restored', handleKeyRestored);

		return () => {
			window.removeEventListener('encryption-key-restored', handleKeyRestored);
		};
	});

	async function loadDrafts() {
		loading = true;
		error = null;

		const result = await draftService.getDraftsPaginated({
			limit: PAGE_SIZE,
			offset: 0
		});

		if (result.error) {
			error = result.error;
		} else {
			drafts = result.drafts;
			totalDrafts = result.total;
			hasMore = result.hasMore;
			offset = PAGE_SIZE;
		}

		loading = false;
	}

	async function loadMoreDrafts() {
		if (loadingMore || !hasMore) return;

		loadingMore = true;

		const result = await draftService.getDraftsPaginated({
			limit: PAGE_SIZE,
			offset
		});

		if (result.error) {
			error = result.error;
		} else {
			drafts = [...drafts, ...result.drafts];
			hasMore = result.hasMore;
			offset += PAGE_SIZE;
		}

		loadingMore = false;
	}

	async function handleDelete(id: string) {
		if (confirmDeleteId !== id) {
			confirmDeleteId = id;
			return;
		}

		deletingId = id;
		// Use soft delete instead of hard delete
		const result = await draftService.softDeleteDraft(id);

		if (result.error) {
			error = result.error;
		} else {
			drafts = drafts.filter((d) => d.id !== id);
			totalDrafts--;
		}

		deletingId = null;
		confirmDeleteId = null;
	}

	function cancelDelete() {
		confirmDeleteId = null;
	}

	function formatDate(date: Date | null): string {
		if (!date) return 'Unknown';
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return `${days} days ago`;
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
		}
	}

	function getIntentLabel(intent: string): string {
		const labels: Record<string, string> = {
			appreciation: 'Appreciation',
			apology: 'Apology',
			boundary: 'Boundary',
			reconnect: 'Reconnect',
			closure: 'Closure',
			other: 'Other'
		};
		return labels[intent] || intent;
	}

	function handleNewDraft() {
		draftStore.newDraft();
		goto(resolve('/write'));
	}

	function handleEditDraft(draft: Draft) {
		draftStore.loadDraft(draft);
		goto(resolve('/write'));
	}

	function handleDateChange(range: DateRange) {
		dateRange = range;
	}

	function clearAllFilters() {
		searchQuery = '';
		selectedRecipient = '';
		dateRange = { start: null, end: null };
	}

	function handleDraftRestored() {
		// Reload drafts to include restored one
		offset = 0;
		drafts = [];
		loadDrafts();
	}
</script>

<svelte:head>
	<title>History | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="fade-in {headerVisible ? 'visible' : ''}">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-base-content">Your Drafts</h1>
				<p class="mt-1 text-sm text-base-content/60">
					{#if loading}
						Loading your drafts...
					{:else if filteredDrafts.length === 0 && drafts.length > 0}
						No drafts match your filters
					{:else}
						{totalDrafts} {totalDrafts === 1 ? 'draft' : 'drafts'} saved
					{/if}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn gap-1 btn-ghost btn-sm"
					onclick={() => (showTrash = true)}
					title="View trash"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					Trash
				</button>
				<button
					type="button"
					onclick={handleNewDraft}
					class="btn gap-2 shadow-sm transition-all duration-200 btn-primary hover:shadow-md hover:shadow-primary/25"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
							clip-rule="evenodd"
						/>
					</svg>
					New Draft
				</button>
			</div>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="fade-in stagger-1 {filtersVisible ? 'visible' : ''}">
		<FilterPanel
			{searchQuery}
			{selectedRecipient}
			{sortBy}
			{dateRange}
			recipients={uniqueRecipients}
			onsearchchange={(v) => (searchQuery = v)}
			onrecipientchange={(v) => (selectedRecipient = v)}
			onsortchange={(v) => (sortBy = v)}
			ondatechange={handleDateChange}
			onclearall={clearAllFilters}
		/>
	</div>

	<!-- Draft List -->
	<div class="fade-in stagger-2 {listVisible ? 'visible' : ''}">
		{#if loading}
			<!-- Loading State -->
			<div class="space-y-4">
				{#each [1, 2, 3] as i (i)}
					<div class="card border border-base-content/10 bg-base-100 shadow-sm">
						<div class="card-body gap-3 p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-2">
									<div class="h-5 w-32 skeleton"></div>
									<div class="h-4 w-full skeleton"></div>
									<div class="h-4 w-3/4 skeleton"></div>
								</div>
							</div>
							<div class="flex gap-2">
								<div class="h-5 w-16 skeleton"></div>
								<div class="h-5 w-20 skeleton"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<!-- Error State -->
			<div
				class="card border border-error/20 bg-error/5 shadow-sm transition-all duration-300 hover:shadow-md"
			>
				<div class="card-body items-center py-12 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-4 h-12 w-12 text-error/60"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<p class="mb-2 text-base-content/80">{error}</p>
					<button type="button" class="btn btn-outline btn-sm" onclick={loadDrafts}>
						Try Again
					</button>
				</div>
			</div>
		{:else if filteredDrafts.length === 0}
			{#if drafts.length === 0}
				<!-- First-time user welcome -->
				<FirstUseWelcome onnewdraft={handleNewDraft} />
			{:else}
				<!-- No matching drafts -->
				<div
					class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
				>
					<div class="card-body items-center py-12 text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mb-4 h-12 w-12 text-base-content/20"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
								clip-rule="evenodd"
							/>
						</svg>
						<h3 class="mb-2 text-lg font-semibold text-base-content/80">No matching drafts</h3>
						<p class="mb-4 text-base-content/60">Try adjusting your search or filters.</p>
						<button type="button" class="btn btn-ghost btn-sm" onclick={clearAllFilters}>
							Clear Filters
						</button>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Draft Cards -->
			<div class="space-y-4">
				{#each filteredDrafts as draft, index (draft.id)}
					<div
						class="card-hover card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300"
						style="animation-delay: {index * 50}ms"
					>
						<div class="card-body gap-3 p-4">
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<!-- Recipient & Time -->
									<div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
										{#if draft.recipient}
											<span class="font-medium text-base-content">To: {draft.recipient}</span>
											<span class="text-base-content/20">|</span>
										{/if}
										<span class="text-base-content/50">
											{formatDate(draft.updatedAt)}
										</span>
									</div>

									<!-- Preview with search highlighting -->
									<DraftPreview content={draft.content} {searchQuery} />
								</div>

								<!-- Actions -->
								<div class="flex shrink-0 items-center gap-2">
									{#if confirmDeleteId === draft.id}
										<button
											type="button"
											class="btn btn-ghost btn-sm"
											onclick={cancelDelete}
											disabled={deletingId === draft.id}
										>
											Cancel
										</button>
										<button
											type="button"
											class="btn btn-sm btn-error"
											onclick={() => draft.id && handleDelete(draft.id)}
											disabled={deletingId === draft.id}
										>
											{#if deletingId === draft.id}
												<span class="loading loading-xs loading-spinner"></span>
											{/if}
											Confirm
										</button>
									{:else}
										<button
											type="button"
											onclick={() => handleEditDraft(draft)}
											class="btn btn-ghost transition-colors duration-200 btn-sm hover:bg-primary/10 hover:text-primary"
											title="Edit draft"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
												/>
											</svg>
										</button>
										<button
											type="button"
											class="btn btn-ghost transition-colors duration-200 btn-sm hover:bg-error/10 hover:text-error"
											onclick={() => draft.id && handleDelete(draft.id)}
											title="Delete draft"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									{/if}
								</div>
							</div>

							<!-- Tags -->
							<div class="flex flex-wrap items-center gap-2">
								{#if draft.intent}
									<span class="badge badge-ghost badge-sm">{getIntentLabel(draft.intent)}</span>
								{/if}
								{#if draft.emotion}
									<span class="badge badge-outline badge-sm badge-secondary">{draft.emotion}</span>
								{/if}
								<span class="ml-auto text-xs text-base-content/40">
									{draft.content.trim().split(/\s+/).length} words
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Load More section -->
			{#if hasMore}
				<div class="flex flex-col items-center gap-3 pt-4">
					<ProgressBar loaded={drafts.length} total={totalDrafts} class="w-full max-w-xs" />
					<button
						type="button"
						class="btn gap-2 btn-outline"
						onclick={loadMoreDrafts}
						disabled={loadingMore}
					>
						{#if loadingMore}
							<span class="loading loading-sm loading-spinner"></span>
							Loading...
						{:else}
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
							Load More ({totalDrafts - drafts.length} remaining)
						{/if}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Trash Modal -->
{#if showTrash}
	<TrashView onclose={() => (showTrash = false)} ondraftrestored={handleDraftRestored} />
{/if}

<style>
	/* Fade-in animations matching write page */
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
</style>
