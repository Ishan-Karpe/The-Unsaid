<!--
  Prompts Page - Conversation starters library
-->
<script lang="ts">
	import { Card, Input } from '$lib/components';
	import { conversationPrompts, categoryLabels } from '$lib/data/prompts';
	import type { PromptCategory } from '$lib/types';

	let selectedCategory: PromptCategory | 'all' = $state('all');
	let searchQuery = $state('');

	const categories = Object.keys(conversationPrompts) as PromptCategory[];

	const filteredPrompts = $derived(() => {
		let prompts = selectedCategory === 'all'
			? Object.values(conversationPrompts).flat()
			: conversationPrompts[selectedCategory];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			prompts = prompts.filter(p => p.text.toLowerCase().includes(query));
		}

		return prompts;
	});
</script>

<svelte:head>
	<title>Prompts | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Conversation Starters</h1>
		<p class="text-base-content/70 mt-1">
			Sometimes the hardest part is beginning. Choose a prompt to get started.
		</p>
	</div>

	<!-- Search and Filter -->
	<div class="flex flex-col md:flex-row gap-4">
		<div class="flex-1">
			<Input
				type="search"
				placeholder="Search prompts..."
				bind:value={searchQuery}
			/>
		</div>
		<select class="select select-bordered w-full md:w-56" bind:value={selectedCategory}>
			<option value="all">All categories</option>
			{#each categories as cat}
				<option value={cat}>{categoryLabels[cat]}</option>
			{/each}
		</select>
	</div>

	<!-- Prompts Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each filteredPrompts() as prompt}
			<Card compact bordered class="hover:shadow-md transition-shadow cursor-pointer">
				<p class="font-medium">{prompt.text}</p>
				<div class="flex justify-between items-center mt-2">
					<span class="badge badge-ghost badge-sm">{categoryLabels[prompt.category]}</span>
					<a href="/write?prompt={prompt.id}" class="btn btn-primary btn-xs">Use this</a>
				</div>
			</Card>
		{/each}
	</div>
</div>
