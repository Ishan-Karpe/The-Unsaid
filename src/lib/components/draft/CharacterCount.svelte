<!--
  CharacterCount.svelte - Word and character counter
  For use outside the textarea label area
  Usage: <CharacterCount />
-->
<script lang="ts">
	import { draftStore } from '$lib/stores/draft.svelte';

	let charCount = $derived(draftStore.draft.content.length);
</script>

<div class="flex items-center gap-4 text-sm text-base-content/60">
	<span>
		<span class="font-medium">{draftStore.wordCount}</span> words
	</span>
	<span>
		<span class="font-medium">{charCount}</span> characters
	</span>
</div>
