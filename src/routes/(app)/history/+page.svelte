<!--
  History Page - View and manage past drafts with elegant animations
  Matches the landing page design language with DaisyUI and Tailwind CSS
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { draftService } from '$lib/services';
	import type { Draft } from '$lib/types';

	// Animation states
	let headerVisible = $state(false);
	let filtersVisible = $state(false);
	let listVisible = $state(false);

	// Data state
	let drafts = $state<Draft[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let searchQuery = $state('');
	let selectedRecipient = $state('');
	let sortBy = $state<'updated' | 'created'>('updated');

	// Delete confirmation
	let deletingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);

	// Computed values
	let uniqueRecipients = $derived(
		[...new Set(drafts.map((d) => d.recipient).filter(Boolean))].sort()
	);

	let filteredDrafts = $derived(() => {
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

		// Sort
		result.sort((a, b) => {
			const dateA = sortBy === 'updated' ? a.updatedAt : a.createdAt;
			const dateB = sortBy === 'updated' ? b.updatedAt : b.createdAt;
			return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
		});

		return result;
	});

	onMount(async () => {
		// Staggered animations
		setTimeout(() => (headerVisible = true), 100);
		setTimeout(() => (filtersVisible = true), 200);
		setTimeout(() => (listVisible = true), 300);

		// Load drafts
		await loadDrafts();
	});

	async function loadDrafts() {
		loading = true;
		error = null;

		const result = await draftService.getDrafts();

		if (result.error) {
			error = result.error;
		} else {
			drafts = result.drafts;
		}

		loading = false;
	}

	async function handleDelete(id: string) {
		if (confirmDeleteId !== id) {
			confirmDeleteId = id;
			return;
		}

		deletingId = id;
		const result = await draftService.deleteDraft(id);

		if (result.error) {
			error = result.error;
		} else {
			drafts = drafts.filter((d) => d.id !== id);
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

	function getPreview(content: string, maxLength: number = 120): string {
		if (content.length <= maxLength) return content;
		return content.slice(0, maxLength).trim() + '...';
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
					{:else if filteredDrafts().length === 0 && drafts.length > 0}
						No drafts match your filters
					{:else}
						{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved
					{/if}
				</p>
			</div>
			<a
				href={resolve('/write')}
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
			</a>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="fade-in stagger-1 {filtersVisible ? 'visible' : ''}">
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-shadow duration-200 hover:shadow-md"
		>
			<div class="card-body gap-4 p-4">
				<div class="flex flex-col gap-4 md:flex-row md:items-center">
					<!-- Search -->
					<div class="relative flex-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-base-content/40"
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
							placeholder="Search drafts..."
							class="input-bordered input w-full bg-base-200/50 pl-10 transition-all duration-200 focus:bg-base-100"
						/>
					</div>

					<!-- Recipient Filter -->
					<select
						bind:value={selectedRecipient}
						class="select-bordered select w-full bg-base-200/50 transition-all duration-200 focus:bg-base-100 md:w-48"
					>
						<option value="">All recipients</option>
						{#each uniqueRecipients as recipient (recipient)}
							<option value={recipient}>{recipient}</option>
						{/each}
					</select>

					<!-- Sort -->
					<select
						bind:value={sortBy}
						class="select-bordered select w-full bg-base-200/50 transition-all duration-200 focus:bg-base-100 md:w-40"
					>
						<option value="updated">Last updated</option>
						<option value="created">Date created</option>
					</select>
				</div>
			</div>
		</div>
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
		{:else if filteredDrafts().length === 0}
			<!-- Empty State -->
			<div
				class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
			>
				<div class="card-body items-center py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-4 h-16 w-16 text-base-content/20"
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
					{#if drafts.length === 0}
						<h3 class="mb-2 text-lg font-semibold text-base-content/80">No drafts yet</h3>
						<p class="mb-6 max-w-sm text-base-content/60">
							Start writing to express what matters most. Your drafts will appear here.
						</p>
						<a
							href={resolve('/write')}
							class="btn gap-2 shadow-sm transition-all duration-200 btn-primary hover:shadow-md hover:shadow-primary/25"
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
							Start Writing
						</a>
					{:else}
						<h3 class="mb-2 text-lg font-semibold text-base-content/80">No matching drafts</h3>
						<p class="mb-4 text-base-content/60">Try adjusting your search or filters.</p>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => {
								searchQuery = '';
								selectedRecipient = '';
							}}
						>
							Clear Filters
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Draft Cards -->
			<div class="space-y-4">
				{#each filteredDrafts() as draft, index (draft.id)}
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

									<!-- Preview -->
									<p class="leading-relaxed text-base-content/70">
										{getPreview(draft.content)}
									</p>
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
										<a
											href={resolve('/write')}
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
										</a>
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
		{/if}
	</div>
</div>

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
