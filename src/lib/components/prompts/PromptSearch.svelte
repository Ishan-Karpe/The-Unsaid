<!--
  PromptSearch.svelte - Search input for prompts with debounce
  A styled search bar that filters prompts by keyword
  Usage: <PromptSearch query={searchQuery} onSearch={(q) => {}} />
-->
<script lang="ts">
	interface Props {
		query: string;
		onSearch: (query: string) => void;
		placeholder?: string;
		class?: string;
	}

	let {
		query = '',
		onSearch,
		placeholder = "Search for 'gratitude', 'apology', or keywords...",
		class: className = ''
	}: Props = $props();

	// Local value for immediate UI feedback - initialized empty, synced via effect
	// eslint-disable-next-line svelte/prefer-writable-derived -- we need writable state for input control
	let localValue = $state('');

	// Debounce timer
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Sync local value when query prop changes externally
	$effect(() => {
		localValue = query;
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		localValue = target.value;

		// Debounce search
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			onSearch(localValue);
		}, 300);
	}

	function handleClear() {
		localValue = '';
		onSearch('');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && localValue) {
			handleClear();
		}
	}

	function handleSubmit() {
		onSearch(localValue);
	}
</script>

<div class="prompt-search {className}">
	<div
		class="flex items-center gap-2 rounded-full border border-base-content/20 bg-base-200/50 p-1.5 shadow-lg transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-primary/10"
	>
		<!-- Search Icon -->
		<div class="pl-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 text-base-content/40"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>

		<input
			type="search"
			value={localValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
			{placeholder}
			class="flex-1 border-0 bg-transparent text-base-content placeholder:text-base-content/40 focus:outline-none"
			aria-label="Search prompts"
		/>

		<!-- Clear Button -->
		{#if localValue}
			<button
				type="button"
				class="text-base-content/40 transition-colors hover:text-base-content"
				onclick={handleClear}
				aria-label="Clear search"
			>
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

		<!-- Find Phrase Button -->
		<button
			type="button"
			class="btn rounded-full bg-primary px-4 text-primary-content btn-sm hover:bg-primary/90"
			onclick={handleSubmit}
		>
			Find Phrase
		</button>
	</div>
</div>
