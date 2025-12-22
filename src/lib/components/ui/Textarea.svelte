<!--
  Textarea.svelte - Reusable textarea for draft editor
  Usage: <Textarea bind:value={content} label="Your message" rows={8} />
-->
<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		error?: string;
		showCount?: boolean;
		maxLength?: number;
		value?: string;
	}

	let {
		label,
		error,
		showCount = false,
		maxLength,
		value = $bindable(''),
		class: className = '',
		id,
		...restProps
	}: Props = $props();

	// Generate stable ID - use provided id or generate one
	const generatedId = `textarea-${Math.random().toString(36).slice(2, 9)}`;
	const textareaId = $derived(id || generatedId);

	const wordCount = $derived(value.trim() ? value.trim().split(/\s+/).length : 0);
	const charCount = $derived(value.length);
</script>

<div class="form-control w-full">
	{#if label}
		<label class="label" for={textareaId}>
			<span class="label-text">{label}</span>
			{#if showCount}
				<span class="label-text-alt">
					{wordCount} words | {charCount}{maxLength ? `/${maxLength}` : ''} chars
				</span>
			{/if}
		</label>
	{/if}

	<textarea
		id={textareaId}
		bind:value
		class="textarea textarea-bordered w-full resize-none {error ? 'textarea-error' : ''} {className}"
		maxlength={maxLength}
		{...restProps}
	></textarea>

	{#if error}
		<label class="label" for={textareaId}>
			<span class="label-text-alt text-error">{error}</span>
		</label>
	{/if}
</div>
