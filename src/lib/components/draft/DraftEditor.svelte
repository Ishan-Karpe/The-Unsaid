<!--
  DraftEditor.svelte - Main draft editing component
  Handles content input with autosave, keyboard shortcuts, and auto-resize
  Usage: <DraftEditor placeholder="Start writing..." />
-->
<script lang="ts">
	import { Textarea } from '$lib/components';
	import { draftStore } from '$lib/stores/draft.svelte';
	import { useAutosave, useKeyboardShortcuts, createCommonShortcuts } from '$lib/hooks';

	interface Props {
		placeholder?: string;
		minRows?: number;
		maxLength?: number;
		autosaveDebounceMs?: number;
		readonly?: boolean;
		onSave?: () => void;
		onSaveError?: (error: string) => void;
	}

	let {
		placeholder = "Start writing... Take your time. There's no rush.",
		minRows = 8,
		maxLength = 10000,
		autosaveDebounceMs = 2000,
		readonly = false,
		onSave,
		onSaveError
	}: Props = $props();

	// Bind to store content (two-way binding requires $state, not $derived)
	// eslint-disable-next-line svelte/prefer-writable-derived
	let content = $state(draftStore.draft.content);

	// Initialize autosave hook (debounceMs is intentionally captured once at init)
	// svelte-ignore state_referenced_locally
	const autosave = useAutosave({
		debounceMs: autosaveDebounceMs,
		onSaveStart: () => {
			// Autosave started
		},
		onSaveSuccess: () => {
			onSave?.();
		},
		onSaveError: (error) => {
			onSaveError?.(error);
		}
	});

	// Initialize keyboard shortcuts
	useKeyboardShortcuts({
		shortcuts: [
			createCommonShortcuts.save(() => {
				// Manual save via Cmd/Ctrl+S
				autosave.saveNow();
			})
		]
	});

	// Sync content changes to store
	function handleInput() {
		if (content !== draftStore.draft.content) {
			draftStore.setContent(content);
			// Autosave will be triggered by the useAutosave hook watching isDirty
		}
	}

	// Watch for external draft loads (e.g., from history)
	$effect(() => {
		content = draftStore.draft.content;
	});

	// Expose autosave methods for parent components
	export function saveNow() {
		return autosave.saveNow();
	}

	export function cancelSave() {
		autosave.cancelSave();
	}
</script>

<div class="draft-editor">
	{#if readonly}
		<!-- Preview mode - read-only styled text -->
		<div
			class="prose-lg prose max-w-none rounded-lg border border-base-content/10 bg-base-200/50 p-6 whitespace-pre-wrap text-base-content"
		>
			{#if content}
				{content}
			{:else}
				<span class="text-base-content/40 italic">No content to preview</span>
			{/if}
		</div>
	{:else}
		<Textarea
			bind:value={content}
			oninput={handleInput}
			{placeholder}
			rows={minRows}
			{maxLength}
			showCount
			class="min-h-[350px] text-lg leading-relaxed"
		/>
	{/if}
</div>

<style>
	.draft-editor :global(textarea) {
		font-family: inherit;
		line-height: 1.75;
	}
</style>
