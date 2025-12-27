<!--
  DateRangePicker.svelte - Date range selection component
  Allows filtering by start and end dates with quick presets
-->
<script lang="ts">
	import type { DateRange } from '$lib/types';

	interface Props {
		startDate?: Date | null;
		endDate?: Date | null;
		onchange?: (range: DateRange) => void;
		class?: string;
	}

	let { startDate = null, endDate = null, onchange, class: className = '' }: Props = $props();

	// Local state for date inputs - these need to be mutable for bind:value and preset buttons
	// eslint-disable-next-line svelte/prefer-writable-derived -- Independent local state intentionally synced from props
	let localStart = $state('');
	// eslint-disable-next-line svelte/prefer-writable-derived -- Independent local state intentionally synced from props
	let localEnd = $state('');

	// Sync local state with props when they change
	$effect(() => {
		localStart = startDate ? formatDateForInput(startDate) : '';
	});

	$effect(() => {
		localEnd = endDate ? formatDateForInput(endDate) : '';
	});

	function formatDateForInput(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function parseDate(value: string): Date | null {
		if (!value) return null;
		const date = new Date(value + 'T00:00:00');
		return isNaN(date.getTime()) ? null : date;
	}

	function handleChange() {
		onchange?.({
			start: parseDate(localStart),
			end: parseDate(localEnd)
		});
	}

	function clearDates() {
		localStart = '';
		localEnd = '';
		onchange?.({ start: null, end: null });
	}

	function setPreset(days: number) {
		const end = new Date();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date used in function, not reactive state
		const start = new Date();
		start.setDate(start.getDate() - days);

		localStart = formatDateForInput(start);
		localEnd = formatDateForInput(end);
		handleChange();
	}
</script>

<div class="flex flex-col gap-2 {className}">
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-2">
			<label class="text-sm text-base-content/60" for="date-start">From</label>
			<input
				id="date-start"
				type="date"
				bind:value={localStart}
				onchange={handleChange}
				max={localEnd || undefined}
				class="input-bordered input input-sm bg-base-200/50"
			/>
		</div>
		<div class="flex items-center gap-2">
			<label class="text-sm text-base-content/60" for="date-end">To</label>
			<input
				id="date-end"
				type="date"
				bind:value={localEnd}
				onchange={handleChange}
				min={localStart || undefined}
				class="input-bordered input input-sm bg-base-200/50"
			/>
		</div>
		{#if localStart || localEnd}
			<button type="button" class="btn btn-ghost btn-xs" onclick={clearDates} title="Clear dates">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Quick presets -->
	<div class="flex flex-wrap gap-1">
		<button type="button" class="btn btn-ghost btn-xs" onclick={() => setPreset(7)}>
			Last 7 days
		</button>
		<button type="button" class="btn btn-ghost btn-xs" onclick={() => setPreset(30)}>
			Last 30 days
		</button>
		<button type="button" class="btn btn-ghost btn-xs" onclick={() => setPreset(90)}>
			Last 3 months
		</button>
	</div>
</div>
