<!--
  OnboardingShell - Container for onboarding flow with progress and navigation

  Features:
  - Progress indicator (stepper dots)
  - Header with step title and description
  - Content slot for step-specific content
  - Back/Next navigation and Skip option
  - Focus management for accessibility
-->
<script lang="ts">
	import { ONBOARDING_STEPS, TOTAL_STEPS, type OnboardingStep } from '$lib/data/onboarding';

	interface Props {
		currentStep: number;
		onNext: () => void;
		onBack: () => void;
		onSkip: () => void;
		loading?: boolean;
		nextDisabled?: boolean;
		customPrimaryCta?: string;
		children?: import('svelte').Snippet;
	}

	let {
		currentStep,
		onNext,
		onBack,
		onSkip,
		loading = false,
		nextDisabled = false,
		customPrimaryCta,
		children
	}: Props = $props();

	// Current step config
	let step = $derived<OnboardingStep | undefined>(ONBOARDING_STEPS[currentStep]);

	// Navigation state
	let canGoBack = $derived(currentStep > 0);

	// Heading element for focus management
	let headingRef = $state<HTMLHeadingElement | null>(null);

	// Focus heading when step changes (for screen readers)
	$effect(() => {
		if (headingRef && currentStep >= 0) {
			// Small delay to allow transition
			setTimeout(() => {
				headingRef?.focus();
			}, 100);
		}
	});
</script>

<div
	class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8"
	role="region"
	aria-label="Onboarding"
>
	<!-- Progress Indicator -->
	<div
		class="mb-8 flex items-center gap-2"
		role="progressbar"
		aria-valuenow={currentStep + 1}
		aria-valuemin={1}
		aria-valuemax={TOTAL_STEPS}
		aria-label="Onboarding progress"
	>
		{#each ONBOARDING_STEPS as stepItem, index (stepItem.id)}
			<button
				type="button"
				class="h-2 rounded-full transition-all duration-300 {index === currentStep
					? 'w-8 bg-primary'
					: index < currentStep
						? 'w-2 bg-primary/60'
						: 'w-2 bg-base-content/20'}"
				aria-label="Step {index + 1} of {TOTAL_STEPS}"
				aria-current={index === currentStep ? 'step' : undefined}
				disabled
			></button>
		{/each}
	</div>

	<!-- Main Content Card -->
	<div class="card w-full max-w-lg border border-base-content/10 bg-base-100 shadow-2xl">
		<div class="card-body p-6 sm:p-8">
			<!-- Step Header -->
			{#if step}
				<div class="mb-6 text-center">
					<h1
						bind:this={headingRef}
						tabindex="-1"
						class="mb-2 text-2xl font-bold tracking-tight text-base-content outline-none sm:text-3xl"
					>
						{step.title}
					</h1>
					<p class="text-base-content/60">
						{step.description}
					</p>
				</div>
			{/if}

			<!-- Step Content (slot) -->
			<div class="mb-6">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- Navigation -->
			<div class="flex flex-col gap-3">
				<!-- Primary Action -->
				<button
					type="button"
					onclick={onNext}
					disabled={loading || nextDisabled}
					class="btn w-full gap-2 transition-all duration-300 btn-primary hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
				>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
					{/if}
					{customPrimaryCta || step?.primaryCta || 'Continue'}
				</button>

				<!-- Secondary Actions Row -->
				<div class="flex items-center justify-between">
					<!-- Back Button -->
					{#if canGoBack}
						<button
							type="button"
							onclick={onBack}
							disabled={loading}
							class="btn gap-1 btn-ghost btn-sm"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Back
						</button>
					{:else}
						<div></div>
					{/if}

					<!-- Skip Button -->
					<button
						type="button"
						onclick={onSkip}
						disabled={loading}
						class="btn text-base-content/50 btn-ghost btn-sm hover:text-base-content"
					>
						{step?.secondaryCta || 'Skip'}
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Step Counter -->
	<p class="mt-4 text-sm text-base-content/40">
		Step {currentStep + 1} of {TOTAL_STEPS}
	</p>
</div>
