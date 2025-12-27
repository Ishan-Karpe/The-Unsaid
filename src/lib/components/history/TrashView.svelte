<!--
  TrashView.svelte - View and restore deleted drafts
  Shows soft-deleted drafts with restore and permanent delete options
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { draftService } from '$lib/services';
	import type { Draft } from '$lib/types';

	interface Props {
		onclose: () => void;
		ondraftrestored: (id: string) => void;
	}

	let { onclose, ondraftrestored }: Props = $props();

	let deletedDrafts = $state<Draft[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let restoringId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let confirmPermanentDeleteId = $state<string | null>(null);

	onMount(() => {
		loadDeletedDrafts();
	});

	async function loadDeletedDrafts() {
		loading = true;
		error = null;

		const result = await draftService.getDeletedDrafts();

		if (result.error) {
			error = result.error;
		} else {
			deletedDrafts = result.drafts;
		}

		loading = false;
	}

	async function handleRestore(id: string) {
		restoringId = id;
		const result = await draftService.restoreDraft(id);

		if (result.error) {
			error = result.error;
		} else {
			deletedDrafts = deletedDrafts.filter((d) => d.id !== id);
			ondraftrestored(id);
		}

		restoringId = null;
	}

	async function handlePermanentDelete(id: string) {
		if (confirmPermanentDeleteId !== id) {
			confirmPermanentDeleteId = id;
			return;
		}

		deletingId = id;
		const result = await draftService.permanentlyDeleteDraft(id);

		if (result.error) {
			error = result.error;
		} else {
			deletedDrafts = deletedDrafts.filter((d) => d.id !== id);
		}

		deletingId = null;
		confirmPermanentDeleteId = null;
	}

	function getPreview(content: string): string {
		if (content.length <= 100) return content;
		return content.slice(0, 100).trim() + '...';
	}
</script>

<dialog class="modal-open modal" aria-modal="true" aria-labelledby="trash-title">
	<div class="modal-box max-w-2xl">
		<div class="mb-4 flex items-center justify-between">
			<h3 id="trash-title" class="text-lg font-bold">Trash</h3>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				onclick={onclose}
				aria-label="Close trash"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
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
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{:else if deletedDrafts.length === 0}
			<div class="py-12 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto mb-4 h-12 w-12 text-base-content/30"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<p class="text-base-content/60">Trash is empty</p>
			</div>
		{:else}
			<p class="mb-4 text-sm text-base-content/60">
				{deletedDrafts.length}
				{deletedDrafts.length === 1 ? 'draft' : 'drafts'} in trash. Drafts in trash will be permanently
				deleted after 30 days.
			</p>

			<div class="max-h-96 space-y-3 overflow-y-auto">
				{#each deletedDrafts as draft (draft.id)}
					<div class="card bg-base-200/50 p-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								{#if draft.recipient}
									<p class="mb-1 text-sm font-medium">To: {draft.recipient}</p>
								{/if}
								<p class="truncate text-sm text-base-content/70">{getPreview(draft.content)}</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								{#if confirmPermanentDeleteId === draft.id}
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => (confirmPermanentDeleteId = null)}
									>
										Cancel
									</button>
									<button
										type="button"
										class="btn btn-xs btn-error"
										onclick={() => draft.id && handlePermanentDelete(draft.id)}
										disabled={deletingId === draft.id}
									>
										{#if deletingId === draft.id}
											<span class="loading loading-xs loading-spinner"></span>
										{/if}
										Delete Forever
									</button>
								{:else}
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => draft.id && handleRestore(draft.id)}
										disabled={restoringId === draft.id}
									>
										{#if restoringId === draft.id}
											<span class="loading loading-xs loading-spinner"></span>
										{/if}
										Restore
									</button>
									<button
										type="button"
										class="btn text-error btn-ghost btn-xs"
										onclick={() => draft.id && handlePermanentDelete(draft.id)}
									>
										Delete
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="modal-action">
			<button type="button" class="btn" onclick={onclose}>Close</button>
		</div>
	</div>
	<button
		type="button"
		class="modal-backdrop bg-black/50"
		onclick={onclose}
		aria-label="Close trash"
	></button>
</dialog>
