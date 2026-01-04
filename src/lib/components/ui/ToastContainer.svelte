<!--
  ToastContainer.svelte - Displays toast notifications
  Place this once in +layout.svelte to enable toast notifications app-wide
  Usage: <ToastContainer />
-->
<script lang="ts">
	import { toastStore, type ToastType } from '$lib/stores/toast.svelte';

	let toasts = $derived(toastStore.toasts);

	const typeClasses: Record<ToastType, string> = {
		success: 'alert-success',
		error: 'alert-error',
		info: 'alert-info',
		warning: 'alert-warning'
	};

	const typeIcons: Record<ToastType, string> = {
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		warning:
			'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
	};
</script>

{#if toasts.length > 0}
	<div class="toast toast-end toast-top z-50" role="status" aria-live="polite">
		{#each toasts as toast (toast.id)}
			<div
				class="alert {typeClasses[toast.type]} {toast.closing ? 'toast-exit' : 'toast-enter'} shadow-lg"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={typeIcons[toast.type]}
					/>
				</svg>
				<span class="text-sm">{toast.message}</span>
				<button
					type="button"
					class="btn btn-ghost btn-xs"
					onclick={() => toastStore.dismiss(toast.id)}
					aria-label="Dismiss notification"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes toast-out {
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(12px);
		}
	}

	:global(.toast-enter) {
		animation: toast-in 0.25s ease-out forwards;
	}

	:global(.toast-exit) {
		animation: toast-out 0.2s ease-in forwards;
	}
</style>
