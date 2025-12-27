<!--
  ProgressBar.svelte - Shows progress of loaded items
  Used in paginated lists to indicate load status
-->
<script lang="ts">
	interface Props {
		loaded: number;
		total: number;
		class?: string;
	}

	let { loaded, total, class: className = '' }: Props = $props();

	let percentage = $derived(total > 0 ? Math.min((loaded / total) * 100, 100) : 0);
</script>

<div class="flex items-center gap-3 text-sm text-base-content/60 {className}">
	<div class="h-1 flex-1 rounded-full bg-base-300">
		<div
			class="h-1 rounded-full bg-primary transition-all duration-300"
			style="width: {percentage}%"
		></div>
	</div>
	<span class="shrink-0 tabular-nums">
		{loaded} of {total}
	</span>
</div>
