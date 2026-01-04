<!--
  MobileDrawer.svelte - Mobile-friendly drawer for editor context
  Provides slide-up drawer on mobile for metadata, feelings, prompts
  Usage: <MobileDrawer bind:open={drawerOpen} />
-->
<script lang="ts">
	import { EmotionPicker, MetadataFields } from '$lib/components';

	interface Props {
		/** Whether the drawer is open */
		open?: boolean;
		/** Callback when drawer is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	/**
	 * Close the drawer
	 */
	function close() {
		open = false;
		onClose?.();
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
		if (event.key === 'Escape') {
			close();
		}
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
		data-testid="mobile-drawer"
		class="animate-slideUp fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-base-100 shadow-2xl"
	>
		<!-- Handle -->
		<div class="sticky top-0 flex justify-center bg-base-100 py-2">
			<div class="h-1 w-10 rounded-full bg-base-content/20"></div>
		</div>

		<!-- Content -->
		<div class="space-y-6 px-4 pb-8">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Context</h2>
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={close}
					aria-label="Close drawer"
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

			<!-- Metadata Fields -->
			<div class="space-y-4">
				<MetadataFields />
			</div>

			<!-- Emotion Picker -->
			<div class="space-y-2">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="label py-1">
					<span class="label-text font-medium">Current Feeling</span>
				</label>
				<EmotionPicker direction="horizontal" size="md" />
			</div>
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
