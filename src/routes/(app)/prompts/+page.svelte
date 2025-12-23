<!--
  Prompts Page - Conversation starters library
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, Input } from '$lib/components';
	import { conversationPrompts, categoryLabels } from '$lib/data/prompts';
	import type { PromptCategory } from '$lib/types';

	let selectedCategory: PromptCategory | 'all' = $state('all');
	let searchQuery = $state('');

	const categories = Object.keys(conversationPrompts) as PromptCategory[];

	// Pre-resolve the write path
	const writePath = resolve('/write');

	const filteredPrompts = $derived(() => {
		let prompts =
			selectedCategory === 'all'
				? Object.values(conversationPrompts).flat()
				: conversationPrompts[selectedCategory];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			prompts = prompts.filter((p) => p.text.toLowerCase().includes(query));
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
		<p class="mt-1 text-base-content/70">
			Sometimes the hardest part is beginning. Choose a prompt to get started.
		</p>
	</div>

	<!-- Search and Filter -->
	<div class="flex flex-col gap-4 md:flex-row">
		<div class="flex-1">
			<Input type="search" placeholder="Search prompts..." bind:value={searchQuery} />
		</div>
		<select class="select-bordered select w-full md:w-56" bind:value={selectedCategory}>
			<option value="all">All categories</option>
			{#each categories as cat (cat)}
				<option value={cat}>{categoryLabels[cat]}</option>
			{/each}
		</select>
	</div>

	<!-- Prompts Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each filteredPrompts() as prompt (prompt.id)}
			<Card compact bordered class="cursor-pointer transition-shadow hover:shadow-md">
				<p class="font-medium">{prompt.text}</p>
				<div class="mt-2 flex items-center justify-between">
					<span class="badge badge-ghost badge-sm">{categoryLabels[prompt.category]}</span>
					<a href="{writePath}?prompt={prompt.id}" class="btn btn-xs btn-primary">Use this</a>
				</div>
			</Card>
		{/each}
	</div>
</div>
