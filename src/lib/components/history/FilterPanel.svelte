<!--
  FilterPanel.svelte - Collapsible filter controls for history page
  Contains search, recipient filter, date range, and sort options
-->
<script lang="ts">
	import DateRangePicker from '$lib/components/ui/DateRangePicker.svelte';
	import type { DateRange } from '$lib/types';

	interface Props {
		searchQuery: string;
		selectedRecipient: string;
		sortBy: 'updated' | 'created';
		dateRange: DateRange;
		recipients: string[];
		onsearchchange: (value: string) => void;
		onrecipientchange: (value: string) => void;
		onsortchange: (value: 'updated' | 'created') => void;
		ondatechange: (range: DateRange) => void;
		onclearall: () => void;
	}

	let {
		searchQuery,
		selectedRecipient,
		sortBy,
		dateRange,
		recipients,
		onsearchchange,
		onrecipientchange,
		onsortchange,
		ondatechange,
		onclearall
	}: Props = $props();

	let showAdvanced = $state(false);

	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' ||
			selectedRecipient !== '' ||
			dateRange.start !== null ||
			dateRange.end !== null
	);
</script>

<div
	class="card border border-base-content/10 bg-base-100 shadow-sm transition-shadow duration-200 hover:shadow-md"
>
	<div class="card-body gap-4 p-4">
		<!-- Main filters row -->
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
					value={searchQuery}
					oninput={(e) => onsearchchange(e.currentTarget.value)}
					placeholder="Search drafts..."
					class="input-bordered input w-full bg-base-200/50 pl-10 transition-all duration-200 focus:bg-base-100"
				/>
			</div>

			<!-- Recipient Filter -->
			<select
				value={selectedRecipient}
				onchange={(e) => onrecipientchange(e.currentTarget.value)}
				class="select-bordered select w-full bg-base-200/50 transition-all duration-200 focus:bg-base-100 md:w-48"
			>
				<option value="">All recipients</option>
				{#each recipients as recipient (recipient)}
					<option value={recipient}>{recipient}</option>
				{/each}
			</select>

			<!-- Sort -->
			<select
				value={sortBy}
				onchange={(e) => onsortchange(e.currentTarget.value as 'updated' | 'created')}
				class="select-bordered select w-full bg-base-200/50 transition-all duration-200 focus:bg-base-100 md:w-40"
			>
				<option value="updated">Last updated</option>
				<option value="created">Date created</option>
			</select>

			<!-- Toggle advanced filters -->
			<button
				type="button"
				class="btn gap-1 btn-ghost btn-sm"
				onclick={() => (showAdvanced = !showAdvanced)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 transition-transform {showAdvanced ? 'rotate-180' : ''}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
				Filters
			</button>
		</div>

		<!-- Advanced filters (collapsible) -->
		{#if showAdvanced}
			<div class="border-t border-base-content/10 pt-4">
				<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<DateRangePicker
						startDate={dateRange.start}
						endDate={dateRange.end}
						onchange={ondatechange}
					/>

					{#if hasActiveFilters}
						<button type="button" class="btn btn-ghost btn-sm" onclick={onclearall}>
							Clear all filters
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
