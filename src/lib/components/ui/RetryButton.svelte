<!--
  RetryButton.svelte - Button with retry logic and exponential backoff

  Provides visual feedback for retry operations with configurable
  retry counts and delays.

  Usage:
    <RetryButton onRetry={fetchData} maxRetries={3}>
      Fetch Data
    </RetryButton>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Async function to execute on click/retry */
		onRetry: () => Promise<void>;
		/** Maximum number of retry attempts */
		maxRetries?: number;
		/** Initial delay in ms before first retry */
		initialDelay?: number;
		/** Button content */
		children?: Snippet;
		/** Disable the button */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Button variant */
		variant?: 'primary' | 'secondary' | 'ghost' | 'error';
		/** Button size */
		size?: 'xs' | 'sm' | 'md' | 'lg';
	}

	let {
		onRetry,
		maxRetries = 3,
		initialDelay = 1000,
		children,
		disabled = false,
		class: className = '',
		variant = 'primary',
		size = 'md'
	}: Props = $props();

	// State
	let isRetrying = $state(false);
	let retryCount = $state(0);
	let lastError = $state<Error | null>(null);
	let nextRetryIn = $state(0);

	// Countdown timer
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	// Variant classes
	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		error: 'btn-error'
	};

	// Size classes
	const sizeClasses = {
		xs: 'btn-xs',
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	/**
	 * Calculate delay with exponential backoff
	 */
	function getDelay(attempt: number): number {
		// Exponential backoff: initialDelay * 2^attempt with jitter
		const exponentialDelay = initialDelay * Math.pow(2, attempt);
		const jitter = Math.random() * 0.3 * exponentialDelay;
		return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
	}

	/**
	 * Execute the retry operation
	 */
	async function handleClick() {
		if (disabled || isRetrying) return;

		isRetrying = true;
		lastError = null;

		try {
			await onRetry();
			// Success - reset state
			retryCount = 0;
			lastError = null;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			retryCount++;

			if (retryCount < maxRetries) {
				// Schedule automatic retry with countdown
				const delay = getDelay(retryCount);
				startCountdown(delay);

				setTimeout(() => {
					if (!disabled) {
						handleClick();
					}
				}, delay);
			}
		} finally {
			isRetrying = false;
		}
	}

	/**
	 * Start countdown display
	 */
	function startCountdown(delayMs: number) {
		nextRetryIn = Math.ceil(delayMs / 1000);

		if (countdownInterval) {
			clearInterval(countdownInterval);
		}

		countdownInterval = setInterval(() => {
			nextRetryIn--;
			if (nextRetryIn <= 0 && countdownInterval) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	/**
	 * Cancel pending retries
	 */
	function cancelRetries() {
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		retryCount = 0;
		nextRetryIn = 0;
		lastError = null;
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
		};
	});

	// Derived states
	let hasMoreRetries = $derived(retryCount < maxRetries);
	let showError = $derived(!!lastError && !isRetrying);
</script>

<div class="inline-flex flex-col items-start gap-1">
	<button
		type="button"
		onclick={handleClick}
		disabled={disabled || isRetrying}
		class="btn gap-2 {variantClasses[variant]} {sizeClasses[size]} {className}"
		aria-busy={isRetrying}
	>
		{#if isRetrying}
			<span class="loading loading-sm loading-spinner"></span>
			{#if retryCount > 0}
				Retrying ({retryCount}/{maxRetries})...
			{:else}
				Loading...
			{/if}
		{:else if nextRetryIn > 0}
			Retrying in {nextRetryIn}s...
		{:else if children}
			{@render children()}
		{:else}
			Retry
		{/if}
	</button>

	<!-- Error display with cancel option -->
	{#if showError && hasMoreRetries && nextRetryIn > 0}
		<div class="flex items-center gap-2 text-xs">
			<span class="text-error/80">
				{lastError?.message || 'Request failed'}
			</span>
			<button type="button" onclick={cancelRetries} class="link text-base-content/60 link-hover">
				Cancel
			</button>
		</div>
	{:else if showError && !hasMoreRetries}
		<div class="text-xs text-error/80">
			Failed after {maxRetries} attempts. Please try again later.
		</div>
	{/if}
</div>
