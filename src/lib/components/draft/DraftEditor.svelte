<!--
  DraftEditor.svelte - Main draft editing component
  Handles content input with character/word counts and auto-resize
  Usage: <DraftEditor placeholder="Start writing..." />
-->
<script lang="ts">
	import { Textarea } from '$lib/components';
	import { draftStore } from '$lib/stores/draft.svelte';

	interface Props {
		placeholder?: string;
		minRows?: number;
		maxRows?: number;
		maxLength?: number;
	}

	let {
		placeholder = "Start writing... Take your time. There's no rush.",
		minRows = 8,
		maxRows = 20,
		maxLength = 10000
	}: Props = $props();

	// Bind to store content
	let content = $state(draftStore.draft.content);

	// Sync content changes to store
	function handleInput() {
		if (content !== draftStore.draft.content) {
			draftStore.setContent(content);
		}
	}

	// Watch for external draft loads (e.g., from history)
	$effect(() => {
		content = draftStore.draft.content;
	});
</script>

<div class="draft-editor">
	<Textarea
		bind:value={content}
		oninput={handleInput}
		{placeholder}
		rows={minRows}
		{maxLength}
		showCount
		class="min-h-[200px] text-lg leading-relaxed"
	/>
</div>

<style>
	.draft-editor :global(textarea) {
		font-family: inherit;
		line-height: 1.75;
	}
</style>
