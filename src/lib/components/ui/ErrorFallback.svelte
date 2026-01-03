<!--
  ErrorFallback.svelte - Error fallback UI component

  Displays a user-friendly error message with recovery options.
  Used by ErrorBoundary when errors are caught.

  Usage:
    <ErrorFallback error={error} onReset={reset} />
-->
<script lang="ts">
	interface Props {
		/** The error that was caught */
		error?: Error | unknown;
		/** Optional callback to reset/retry */
		onReset?: () => void;
		/** Title to display */
		title?: string;
		/** Subtitle/description */
		description?: string;
		/** Size variant */
		variant?: 'full' | 'inline' | 'compact';
		/** Whether to show error details (development only) */
		showDetails?: boolean;
	}

	let {
		error,
		onReset,
		title = 'Something went wrong',
		description = "We're sorry, but something unexpected happened. Please try again.",
		variant = 'full',
		showDetails = false
	}: Props = $props();

	// Extract error message safely
	let errorMessage = $derived.by(() => {
		if (!error) return 'Unknown error';
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		return String(error);
	});

	// Show stack trace in development
	let errorStack = $derived.by(() => {
		if (!showDetails || !error) return null;
		if (error instanceof Error && error.stack) return error.stack;
		return null;
	});

	// Variant-specific classes
	const variantClasses = {
		full: 'min-h-[50vh] p-8',
		inline: 'p-6',
		compact: 'p-4'
	};
</script>

<div
	class="flex flex-col items-center justify-center text-center {variantClasses[variant]}"
	role="alert"
	aria-live="assertive"
>
	<!-- Error Icon -->
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10"
		aria-hidden="true"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-8 w-8 text-error"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
	</div>

	<!-- Title -->
	<h2 class="mb-2 text-xl font-bold text-base-content {variant === 'compact' ? 'text-lg' : ''}">
		{title}
	</h2>

	<!-- Description -->
	<p class="mb-4 max-w-md text-base-content/60 {variant === 'compact' ? 'text-sm' : ''}">
		{description}
	</p>

	<!-- Error Details (development) -->
	{#if showDetails && errorMessage}
		<div class="mb-4 w-full max-w-lg">
			<div class="collapse-arrow collapse border border-error/20 bg-error/5">
				<input type="checkbox" aria-label="Toggle error details" />
				<div class="collapse-title text-sm font-medium text-error">Error Details</div>
				<div class="collapse-content">
					<code class="block text-left text-xs break-all whitespace-pre-wrap text-error/80">
						{errorMessage}
						{#if errorStack}
							<br /><br />
							{errorStack}
						{/if}
					</code>
				</div>
			</div>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex flex-wrap gap-2">
		{#if onReset}
			<button
				type="button"
				onclick={onReset}
				class="btn gap-2 btn-primary"
				aria-label="Try again to recover from error"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Try Again
			</button>
		{/if}

		<button
			type="button"
			onclick={() => window.location.reload()}
			class="btn btn-ghost"
			aria-label="Reload the page"
		>
			Reload Page
		</button>
	</div>
</div>
