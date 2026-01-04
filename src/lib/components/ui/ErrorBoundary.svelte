<!--
  ErrorBoundary.svelte - Svelte 5 error boundary wrapper

  Catches errors in child components and displays a fallback UI.
  Uses svelte:boundary for error handling.

  Features:
  - Catches rendering and effect errors
  - Logs errors (privacy-first, console only)
  - Provides reset functionality
  - Supports custom fallback UI

  Usage:
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
-->
<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import ErrorFallback from './ErrorFallback.svelte';
	import { monitoringService } from '$lib/services/monitoring';

	interface Props {
		/** Content to render */
		children: Snippet;
		/** Optional error handler for logging */
		onError?: (error: Error) => void;
		/** Title for default error UI */
		fallbackTitle?: string;
		/** Description for default error UI */
		fallbackDescription?: string;
		/** Variant for default error UI */
		variant?: 'full' | 'inline' | 'compact';
		/** Show error details (dev mode) */
		showDetails?: boolean;
	}

	let {
		children,
		onError,
		fallbackTitle,
		fallbackDescription,
		variant = 'inline',
		showDetails = false
	}: Props = $props();

	/**
	 * Handle errors caught by the boundary
	 * Logs to console (privacy-first, no external logging)
	 */
	function handleError(error: unknown) {
		// Report error to monitoring hook (Sentry-ready)
		monitoringService.captureError(error, { source: 'ErrorBoundary' });

		// Call optional error handler
		if (onError && error instanceof Error) {
			try {
				onError(error);
			} catch (handlerError) {
				console.error('[ErrorBoundary] Error in onError handler:', handlerError);
			}
		}
	}
</script>

<svelte:boundary onerror={(e) => handleError(e)}>
	{@render children()}

	{#snippet failed(error: unknown, reset: () => void)}
		<ErrorFallback
			{error}
			onReset={async () => {
				await tick();
				reset();
			}}
			title={fallbackTitle}
			description={fallbackDescription}
			{variant}
			{showDetails}
		/>
	{/snippet}
</svelte:boundary>
