<!--
  Onboarding Page - 4-step guided introduction to The Unsaid

  Steps:
  1. Welcome - Introduction and value props
  2. Privacy - Explanation of encryption
  3. AI Consent - Explicit opt-in for AI features
  4. First Draft - Guided first message creation
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { preferencesService } from '$lib/services';
	import { draftStore } from '$lib/stores/draft.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { TOTAL_STEPS } from '$lib/data/onboarding';
	import {
		OnboardingShell,
		WelcomeStep,
		PrivacyStep,
		AIConsentStep,
		FirstDraftStep
	} from '$lib/components/onboarding';

	// Get user from page data
	let user = $derived($page.data.user);

	// Current step state
	let currentStep = $state(0);
	let loading = $state(false);

	// First draft form state
	let recipient = $state('');
	let intent = $state('');
	let starterPrompt = $state('');

	// Custom CTA for AI consent step
	let customPrimaryCta = $derived(currentStep === 2 ? 'Enable AI' : undefined);

	// Determine if next button should be disabled
	let nextDisabled = $derived(
		// First draft step requires at least a recipient
		currentStep === 3 && !recipient.trim()
	);

	/**
	 * Handle moving to next step
	 */
	async function handleNext() {
		loading = true;

		try {
			// Special handling for AI consent step
			if (currentStep === 2 && user?.id) {
				// User clicked "Enable AI"
				const { error } = await preferencesService.enableAI(user.id);
				if (error) {
					toastStore.error('Failed to enable AI: ' + error);
				} else {
					toastStore.success('AI features enabled');
				}
			}

			// Special handling for final step
			if (currentStep === TOTAL_STEPS - 1) {
				await completeOnboarding();
				return;
			}

			// Move to next step
			currentStep++;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An error occurred';
			toastStore.error(message);
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle going back to previous step
	 */
	function handleBack() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	/**
	 * Handle skipping onboarding
	 */
	async function handleSkip() {
		// On AI consent step, "Not now" just skips to next step without enabling AI
		if (currentStep === 2) {
			currentStep++;
			return;
		}

		// For other steps, offer to skip entire onboarding
		loading = true;

		try {
			if (user?.id) {
				const { error } = await preferencesService.skipOnboarding(user.id);
				if (error) {
					toastStore.error('Failed to skip onboarding: ' + error);
					return;
				}
			}

			// Navigate to write page
			goto(resolve('/write'));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An error occurred';
			toastStore.error(message);
		} finally {
			loading = false;
		}
	}

	/**
	 * Complete onboarding and navigate to write
	 */
	async function completeOnboarding() {
		if (!user?.id) {
			toastStore.error('User not found');
			return;
		}

		try {
			// Mark onboarding as complete
			const { error } = await preferencesService.completeOnboarding(user.id);
			if (error) {
				toastStore.error('Failed to complete onboarding: ' + error);
				return;
			}

			// If user filled in first draft info, set up the draft store
			if (recipient.trim()) {
				draftStore.newDraft();
				draftStore.setMetadata({
					recipient: recipient.trim(),
					intent: intent || 'other'
				});

				if (starterPrompt) {
					draftStore.setContent(starterPrompt + ' ');
				}
			}

			// Navigate to write page with onboarding flag
			goto(`${resolve('/write')}?onboarding=1`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An error occurred';
			toastStore.error(message);
		}
	}

	// Handlers for FirstDraftStep
	function handleRecipientChange(value: string) {
		recipient = value;
	}

	function handleIntentChange(value: string) {
		intent = value;
		// Reset starter prompt when intent changes
		starterPrompt = '';
	}

	function handleStarterPromptChange(value: string) {
		starterPrompt = value;
	}
</script>

<svelte:head>
	<title>Welcome | The Unsaid</title>
</svelte:head>

<!-- Background with gradient matching landing page -->
<div class="min-h-screen bg-gradient-to-b from-base-300 via-base-200 to-base-300">
	<!-- Animated background orbs -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div
			class="animate-float-slow absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl"
		></div>
		<div
			class="animate-float-slower absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl"
		></div>
		<div
			class="animate-float-slow absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
		></div>
	</div>

	<!-- Onboarding Content -->
	<div class="relative z-10">
		<OnboardingShell
			{currentStep}
			onNext={handleNext}
			onBack={handleBack}
			onSkip={handleSkip}
			{loading}
			{nextDisabled}
			{customPrimaryCta}
		>
			{#if currentStep === 0}
				<WelcomeStep />
			{:else if currentStep === 1}
				<PrivacyStep />
			{:else if currentStep === 2}
				<AIConsentStep />
			{:else if currentStep === 3}
				<FirstDraftStep
					{recipient}
					{intent}
					{starterPrompt}
					onRecipientChange={handleRecipientChange}
					onIntentChange={handleIntentChange}
					onStarterPromptChange={handleStarterPromptChange}
				/>
			{/if}
		</OnboardingShell>
	</div>
</div>

<style>
	/* Floating animation for background orbs */
	@keyframes float-slow {
		0%,
		100% {
			transform: translateY(0) translateX(0);
		}
		50% {
			transform: translateY(-20px) translateX(10px);
		}
	}

	@keyframes float-slower {
		0%,
		100% {
			transform: translateY(0) translateX(0);
		}
		50% {
			transform: translateY(15px) translateX(-15px);
		}
	}

	:global(.animate-float-slow) {
		animation: float-slow 8s ease-in-out infinite;
	}

	:global(.animate-float-slower) {
		animation: float-slower 12s ease-in-out infinite;
	}
</style>
