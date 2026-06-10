<!--
  VersionHistoryDrawer.svelte - Slide-up drawer listing encrypted draft snapshots
  Loads versions when opened, shows previews, and supports two-step restore
  Usage: <VersionHistoryDrawer draftId={id} open={open} onClose={fn} onRestored={fn} />
-->
<script lang="ts">
	import { Alert, Button, LoadingSpinner } from '$lib/components';
	import { versionService } from '$lib/services';
	import type { Draft, DraftVersion } from '$lib/types';

	interface Props {
		/** The draft whose history is shown */
		draftId: string;
		/** Whether the drawer is open */
		open: boolean;
		/** Callback when drawer is closed */
		onClose: () => void;
		/** Callback with the restored draft after a successful restore */
		onRestored: (draft: Draft) => void;
	}

	let { draftId, open, onClose, onRestored }: Props = $props();

	let versions = $state<DraftVersion[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let restoringId = $state<string | null>(null);
	let confirmingId = $state<string | null>(null);

	let isEmpty = $derived(!loading && !error && versions.length === 0);

	// Load versions whenever the drawer is opened
	$effect(() => {
		if (open && draftId) {
			loadVersions();
		}
	});

	async function loadVersions() {
		loading = true;
		error = null;
		confirmingId = null;
		const result = await versionService.listVersions(draftId);
		versions = result.versions;
		error = result.error;
		loading = false;
	}

	/**
	 * Two-step restore: first click arms confirmation, second click restores
	 */
	async function handleRestore(version: DraftVersion) {
		if (confirmingId !== version.id) {
			confirmingId = version.id;
			return;
		}

		restoringId = version.id;
		error = null;
		const { draft, error: restoreError } = await versionService.restoreVersion(draftId, version);
		restoringId = null;
		confirmingId = null;

		if (restoreError || !draft) {
			error = restoreError || 'Failed to restore version';
			return;
		}

		onRestored(draft);
		close();
	}

	/**
	 * Truncate content for the card preview
	 */
	function preview(content: string, max = 150) {
		return content.length > max ? content.slice(0, max).trimEnd() + '…' : content;
	}

	/**
	 * Format a date as a short relative timestamp
	 */
	function formatRelative(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	/**
	 * Close the drawer
	 */
	function close() {
		confirmingId = null;
		onClose();
	}

	/**
	 * Handle backdrop click
	 */
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			close();
		}
	}

	/**
	 * Handle escape key
	 */
	function handleKeyDown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			close();
		}
	}

	/**
	 * Focus the close button when the drawer mounts
	 */
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-black/50 transition-opacity"
		onclick={handleBackdropClick}
	></div>

	<!-- Drawer -->
	<div
		data-testid="version-history-drawer"
		role="dialog"
		aria-modal="true"
		aria-label="Version history"
		class="animate-slideUp fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-base-100 shadow-2xl"
	>
		<!-- Handle -->
		<div class="sticky top-0 flex justify-center bg-base-100 py-2">
			<div class="h-1 w-10 rounded-full bg-base-content/20"></div>
		</div>

		<!-- Content -->
		<div class="space-y-4 px-4 pb-8">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Version History</h2>
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={close}
					aria-label="Close version history"
					use:focusOnMount
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
				<div class="flex justify-center py-8">
					<LoadingSpinner size="lg" label="Loading versions" />
				</div>
			{:else if error}
				<Alert type="error">{error}</Alert>
			{:else if isEmpty}
				<p class="py-8 text-center text-sm text-base-content/60">
					No previous versions yet — snapshots are taken as you write.
				</p>
			{:else}
				<ul class="space-y-3">
					{#each versions as version (version.id)}
						<li class="card border border-base-content/10 bg-base-100 shadow-sm">
							<div class="card-body gap-2 p-4">
								<div class="flex items-center justify-between gap-2">
									<span class="text-xs text-base-content/60">
										{formatRelative(version.createdAt)}
									</span>
									<div class="flex flex-wrap justify-end gap-1">
										{#if version.recipient}
											<span class="badge badge-ghost badge-sm">To: {version.recipient}</span>
										{/if}
										{#if version.intent}
											<span class="badge badge-ghost badge-sm">{version.intent}</span>
										{/if}
									</div>
								</div>

								<p class="text-sm whitespace-pre-wrap text-base-content/80">
									{preview(version.content)}
								</p>

								<div class="flex justify-end">
									<Button
										variant="primary"
										size="sm"
										loading={restoringId === version.id}
										onclick={() => handleRestore(version)}
										aria-label={confirmingId === version.id
											? 'Confirm restore of this version'
											: 'Restore this version'}
									>
										{confirmingId === version.id ? 'Confirm restore?' : 'Restore'}
									</Button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out;
	}
</style>
