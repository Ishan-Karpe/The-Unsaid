<!--
  DraftPreview.svelte - Draft preview with search term highlighting
  Highlights matching text when searching
-->
<script lang="ts">
	interface Props {
		content: string;
		searchQuery: string;
		maxLength?: number;
	}

	let { content, searchQuery, maxLength = 120 }: Props = $props();

	// Escape regex special characters
	function escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// Get preview with highlighted search terms
	let preview = $derived.by(() => {
		let text = content;

		// If content is too long, try to center around the first match
		if (text.length > maxLength && searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			const matchIndex = text.toLowerCase().indexOf(query);

			if (matchIndex > 0) {
				// Center the preview around the match
				const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
				const end = Math.min(text.length, start + maxLength);
				text =
					(start > 0 ? '...' : '') + text.slice(start, end) + (end < content.length ? '...' : '');
			} else {
				// No match in content, just truncate from start
				text = text.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
			}
		} else if (text.length > maxLength) {
			text = text.slice(0, maxLength).trim() + '...';
		}

		return text;
	});

	// Split text into parts for highlighting
	let parts = $derived.by(() => {
		if (!searchQuery.trim()) {
			return [{ text: preview, highlight: false }];
		}

		const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
		const segments = preview.split(regex);

		return segments
			.filter((segment) => segment.length > 0)
			.map((segment) => ({
				text: segment,
				highlight: segment.toLowerCase() === searchQuery.toLowerCase()
			}));
	});
</script>

<p class="leading-relaxed text-base-content/70">
	{#each parts as part, i (i)}
		{#if part.highlight}
			<mark class="rounded bg-primary/30 px-0.5 text-base-content">{part.text}</mark>
		{:else}
			{part.text}
		{/if}
	{/each}
</p>
