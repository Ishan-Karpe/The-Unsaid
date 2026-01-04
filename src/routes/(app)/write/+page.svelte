<!--
  Write Page - Core drafting experience with sidebar, AI tools, and elegant animations
  Matches the landing page design language with DaisyUI and Tailwind CSS
  Integrated with draftStore for centralized state management
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		conversationPrompts,
		categoryLabels,
		getPromptById,
		markPromptAsUsed
	} from '$lib/data/prompts';
	import type { PromptCategory, AIMode } from '$lib/types';
	import {
		DraftEditor,
		MetadataFields,
		SyncIndicator,
		AISuggestions,
		MobileDrawer,
		AIConsentModal
	} from '$lib/components';
	import { draftStore } from '$lib/stores/draft.svelte';
	import { aiStore } from '$lib/stores/ai.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { preferencesService } from '$lib/services';

	// Animation states
	let sidebarVisible = $state(false);
	let editorVisible = $state(false);

	// Onboarding welcome banner
	let showOnboardingBanner = $state(false);

	// Mobile drawer state
	let mobileDrawerOpen = $state(false);

	// Local UI state (not draft data)
	let privacyMode = $state(true);
	let showPrompts = $state(false);
	let selectedCategory = $state<PromptCategory>('gratitude');
	let previewMode = $state(false);

	// AI consent state
	let aiEnabled = $state(false);
	let showConsentModal = $state(false);
	let pendingAIMode = $state<AIMode | null>(null);

	// Duplicate request prevention
	let lastRequestKey = $state<string>('');

	// Feelings options for the sidebar
	const feelings = [
		{ value: 'grateful', label: 'Grateful' },
		{ value: 'anxious', label: 'Anxious' },
		{ value: 'hopeful', label: 'Hopeful' },
		{ value: 'hurt', label: 'Hurt' },
		{ value: 'confused', label: 'Confused' },
		{ value: 'loving', label: 'Loving' },
		{ value: 'frustrated', label: 'Frustrated' },
		{ value: 'relieved', label: 'Relieved' }
	];

	// AI tools - all 5 modes with descriptions for tooltips
	const aiTools: { mode: AIMode; label: string; icon: string; description: string }[] = [
		{
			mode: 'clarify',
			label: 'Clarify',
			icon: 'clarify',
			description: 'Simplify while preserving meaning'
		},
		{
			mode: 'alternatives',
			label: 'Alternatives',
			icon: 'alternatives',
			description: 'Different ways to say it'
		},
		{
			mode: 'tone',
			label: 'Tone',
			icon: 'tone',
			description: 'Adjust emotional delivery'
		},
		{
			mode: 'expand',
			label: 'Go Deeper',
			icon: 'expand',
			description: 'Questions to explore further'
		},
		{
			mode: 'opening',
			label: 'Opening',
			icon: 'opening',
			description: 'How to start your message'
		}
	];

	// Computed values from store
	let wordCount = $derived(draftStore.wordCount);
	let readTime = $derived(Math.max(1, Math.ceil(wordCount / 200)));
	let currentEmotion = $derived(draftStore.draft.emotion);
	let hasContent = $derived(draftStore.draft.content.trim().length > 0);

	// AI state
	let isAILoading = $derived(aiStore.isLoading);
	let showAISuggestions = $derived(aiStore.status !== 'idle');

	onMount(() => {
		setTimeout(() => (sidebarVisible = true), 100);
		setTimeout(() => (editorVisible = true), 200);

		// Check if coming from onboarding
		const isFromOnboarding = $page.url.searchParams.get('onboarding') === '1';
		if (isFromOnboarding) {
			showOnboardingBanner = true;
			// Auto-dismiss after 8 seconds
			setTimeout(() => {
				showOnboardingBanner = false;
			}, 8000);
			// Clear the URL parameter
			const url = new URL(window.location.href);
			url.searchParams.delete('onboarding');
			window.history.replaceState({}, '', url.toString());
		}

		// Check if coming from prompts page with a prompt ID
		const promptId = $page.url.searchParams.get('prompt');
		if (promptId) {
			const prompt = getPromptById(promptId);
			if (prompt) {
				// Pre-populate the editor with the prompt text
				draftStore.setContent(prompt.text + ' ');
				markPromptAsUsed(promptId);
				toastStore.info('Prompt loaded! Start writing your message.');

				// Clear the URL parameter to prevent re-loading on refresh
				const url = new URL(window.location.href);
				url.searchParams.delete('prompt');
				window.history.replaceState({}, '', url.toString());
			}
		}
	});

	// Check AI consent when user is available
	$effect(() => {
		if (authStore.user?.id) {
			checkAIConsent();
		}
	});

	async function checkAIConsent() {
		const user = authStore.user;
		if (!user?.id) return;

		try {
			const enabled = await preferencesService.isAIEnabled(user.id);
			aiEnabled = enabled;
		} catch (err) {
			// If we can't check consent, assume AI is disabled for safety
			// User can still enable via settings
			console.error('Failed to check AI consent:', err);
			aiEnabled = false;
		}
	}

	function toggleFeeling(feeling: string) {
		// Toggle emotion - if already selected, clear it
		if (currentEmotion === feeling) {
			draftStore.setMetadata({ emotion: undefined });
		} else {
			draftStore.setMetadata({ emotion: feeling });
		}
	}

	function selectPrompt(promptText: string) {
		draftStore.setContent(promptText + ' ');
		showPrompts = false;
	}

	function handleAITool(mode: AIMode) {
		// Don't trigger if already loading or no content
		if (isAILoading || !hasContent) return;

		// Check for AI consent
		if (!aiEnabled) {
			// Show consent modal and store pending mode
			pendingAIMode = mode;
			showConsentModal = true;
			return;
		}

		// Proceed with AI request
		executeAIRequest(mode);
	}

	function executeAIRequest(mode: AIMode) {
		// Get current draft data
		const draftText = draftStore.draft.content.trim();
		const recipient = draftStore.draft.recipient || 'someone special';
		const intent = draftStore.draft.intent || 'express my feelings';

		// Build request key to detect duplicates
		const requestKey = `${mode}:${draftText.slice(0, 100)}`;

		// Skip if same request as last time (user double-clicked)
		if (requestKey === lastRequestKey && aiStore.isLoading) {
			console.log('Skipping duplicate AI request');
			return;
		}

		lastRequestKey = requestKey;

		// Request AI suggestions
		aiStore.requestSuggestions(mode, draftText, recipient, intent);
	}

	function handleConsentGranted() {
		aiEnabled = true;
		showConsentModal = false;

		// Execute the pending AI request if any
		if (pendingAIMode) {
			executeAIRequest(pendingAIMode);
			pendingAIMode = null;
		}
	}

	function handleConsentDeclined() {
		showConsentModal = false;
		pendingAIMode = null;
	}

	function handleApplySuggestion(text: string) {
		// Replace draft content with selected suggestion
		draftStore.setContent(text);

		// Show success toast to confirm the action
		toastStore.success('Suggestion applied! Your original is preserved in history.');
	}

	function handleDismissSuggestions() {
		// Clear AI state (already handled by AISuggestions component)
		// Optionally show a subtle info message
	}
</script>

<svelte:head>
	<title>Write | The Unsaid</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-5rem)] flex-col gap-6 pb-8">
	<!-- Onboarding Welcome Banner -->
	{#if showOnboardingBanner}
		<div
			class="animate-fadeIn relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-r from-success/10 via-primary/5 to-success/10 p-4"
			role="status"
			aria-live="polite"
		>
			<!-- Decorative sparkle -->
			<div
				class="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-success/20 blur-2xl"
			></div>

			<div class="relative z-10 flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-success"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-base-content">You're all set!</h3>
						<p class="text-sm text-base-content/70">
							Start writing your first draft. Take your time - this is just for you.
						</p>
					</div>
				</div>
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={() => (showOnboardingBanner = false)}
					aria-label="Dismiss welcome message"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
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
		</div>
	{/if}

	<div class="flex flex-1 gap-4">
		<!-- Left Sidebar -->
		<aside
			class="fade-in hidden w-72 shrink-0 space-y-4 lg:block {sidebarVisible ? 'visible' : ''}"
		>
			<!-- Context Section -->
			<div class="card border border-base-content/10 bg-base-100 shadow-sm">
				<div class="card-body gap-4 p-4">
					<h3
						class="flex items-center gap-2 text-sm font-semibold tracking-wider text-base-content/70 uppercase"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
								clip-rule="evenodd"
							/>
						</svg>
						Context
					</h3>

					<!-- Metadata Fields Component -->
					<MetadataFields />

					<!-- Current Feeling -->
					<div class="form-control">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="label py-1">
							<span class="label-text text-xs font-medium text-base-content/60"
								>Current Feeling</span
							>
						</label>
						<div class="flex flex-wrap gap-1.5">
							{#each feelings as feeling (feeling.value)}
								<button
									type="button"
									class="badge cursor-pointer transition-all duration-200 {currentEmotion ===
									feeling.value
										? 'badge-primary'
										: 'hover:badge-primary/50 badge-ghost'}"
									onclick={() => toggleFeeling(feeling.value)}
								>
									{feeling.label}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Prompts Section -->
			<div class="card border border-base-content/10 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<button
						type="button"
						class="flex w-full items-center justify-between text-sm font-semibold tracking-wider text-base-content/70 uppercase"
						onclick={() => (showPrompts = !showPrompts)}
					>
						<span class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"
								/>
							</svg>
							Prompts
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 transition-transform duration-200 {showPrompts ? 'rotate-180' : ''}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#if showPrompts}
						<div class="animate-slideDown space-y-3">
							<!-- Category Tabs -->
							<div class="flex flex-wrap gap-1">
								{#each Object.keys(conversationPrompts) as category (category)}
									<button
										type="button"
										class="badge cursor-pointer text-xs transition-all duration-200 {selectedCategory ===
										category
											? 'badge-primary'
											: 'hover:badge-primary/50 badge-ghost'}"
										onclick={() => (selectedCategory = category as PromptCategory)}
									>
										{categoryLabels[category as PromptCategory]}
									</button>
								{/each}
							</div>

							<!-- Prompts List -->
							<div class="max-h-40 space-y-1 overflow-y-auto">
								{#each conversationPrompts[selectedCategory] as prompt (prompt.id)}
									<button
										type="button"
										class="w-full rounded-lg p-2 text-left text-sm text-base-content/80 transition-colors duration-150 hover:bg-base-200"
										onclick={() => selectPrompt(prompt.text)}
									>
										"{prompt.text}"
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- AI Tools Section -->
			<div class="card border border-base-content/10 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h3
						class="flex items-center gap-2 text-sm font-semibold tracking-wider text-base-content/70 uppercase"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
							/>
						</svg>
						AI Tools
					</h3>

					<div class="space-y-2">
						{#each aiTools as tool (tool.mode)}
							<button
								type="button"
								class="btn w-full justify-start gap-2 btn-ghost transition-all duration-200 btn-sm hover:bg-primary/10 hover:text-primary {isAILoading &&
								aiStore.activeMode === tool.mode
									? 'loading'
									: ''}"
								onclick={() => handleAITool(tool.mode)}
								disabled={!hasContent || isAILoading}
							>
								{#if tool.icon === 'clarify'}
									<!-- Pencil/Edit icon for Clarify -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
										/>
									</svg>
								{:else if tool.icon === 'alternatives'}
									<!-- Switch/Arrows icon for Alternatives -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
										/>
									</svg>
								{:else if tool.icon === 'tone'}
									<!-- Info/Mood icon for Tone -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else if tool.icon === 'expand'}
									<!-- Expand arrows icon -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else if tool.icon === 'opening'}
									<!-- Quote/Speech icon for Opening -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
								{tool.label}
							</button>
						{/each}
					</div>

					<!-- Privacy Mode Toggle -->
					<div class="divider my-2"></div>
					<label class="flex cursor-pointer items-center justify-between">
						<span class="flex items-center gap-2 text-sm text-base-content/70">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Privacy Mode
						</span>
						<input
							type="checkbox"
							bind:checked={privacyMode}
							class="toggle toggle-primary toggle-sm"
						/>
					</label>
				</div>
			</div>
		</aside>

		<!-- Main Editor Area -->
		<main class="fade-in stagger-1 flex min-w-0 flex-1 flex-col {editorVisible ? 'visible' : ''}">
			<!-- Status Bar -->
			<div
				class="mb-4 flex items-center justify-between rounded-lg border border-base-content/10 bg-base-100 px-4 py-2 shadow-sm"
			>
				<div class="flex items-center gap-4">
					<!-- Sync Status Component -->
					<SyncIndicator />
				</div>

				<div class="flex items-center gap-4 text-sm text-base-content/60">
					<span>{wordCount} words</span>
					<span class="text-base-content/20">|</span>
					<span>{readTime} min read</span>
				</div>
			</div>

			<!-- Editor Card -->
			<div class="card flex-1 border border-base-content/10 bg-base-100 shadow-sm">
				<div class="card-body flex flex-col gap-4 p-6">
					<!-- Draft Editor Component -->
					<DraftEditor readonly={previewMode} />

					{#if privacyMode}
						<div
							class="pointer-events-none flex items-center gap-1 self-end rounded-lg bg-base-200/80 px-2 py-1 text-xs text-base-content/50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3 w-3"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Encrypted
						</div>
					{/if}
				</div>
			</div>

			<!-- AI Suggestions Panel -->
			{#if showAISuggestions}
				<div class="mt-4">
					<AISuggestions onApply={handleApplySuggestion} onDismiss={handleDismissSuggestions} />
				</div>
			{/if}

			<!-- Bottom Action Bar -->
			<div
				class="mt-4 flex items-center justify-between rounded-lg border border-base-content/10 bg-base-100 px-4 py-3 shadow-sm"
			>
				<!-- Keyboard Shortcut Hint -->
				<div class="hidden text-xs text-base-content/40 md:block">
					<span class="kbd kbd-xs">Cmd</span>
					+
					<span class="kbd kbd-xs">S</span>
					to save
				</div>

				<!-- Primary Actions -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="btn gap-2 btn-sm {previewMode ? 'btn-primary' : 'btn-ghost'}"
						onclick={() => (previewMode = !previewMode)}
						disabled={!hasContent}
					>
						{#if previewMode}
							<!-- Edit icon when in preview mode -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
								/>
							</svg>
							Edit
						{:else}
							<!-- Eye icon for preview -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
								<path
									fill-rule="evenodd"
									d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Preview
						{/if}
					</button>
				</div>
			</div>
		</main>
	</div>

	<!-- Mobile Context Drawer Toggle (shown on smaller screens) -->
	<div class="fixed right-4 bottom-24 lg:hidden">
		<button
			type="button"
			class="btn btn-circle min-h-[56px] min-w-[56px] shadow-lg btn-primary"
			onclick={() => (mobileDrawerOpen = true)}
			aria-label="Open context menu"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>

	<!-- Mobile Drawer for Context (metadata, feelings) -->
	<MobileDrawer bind:open={mobileDrawerOpen} />

	<!-- AI Consent Modal -->
	{#if showConsentModal && authStore.user}
		<AIConsentModal
			userId={authStore.user.id}
			onConsent={handleConsentGranted}
			onDecline={handleConsentDeclined}
		/>
	{/if}
</div>

<style>
	/* Fade-in animations matching landing page */
	.fade-in {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.stagger-1 {
		transition-delay: 0.1s;
	}

	/* Slide down animation for prompts */
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-slideDown) {
		animation: slideDown 0.3s ease-out forwards;
	}

	/* Fade-in animation for onboarding banner */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fadeIn) {
		animation: fadeIn 0.5s ease-out forwards;
	}

	/* Custom scrollbar for prompts */
	.max-h-40::-webkit-scrollbar {
		width: 4px;
	}

	.max-h-40::-webkit-scrollbar-track {
		background: transparent;
	}

	.max-h-40::-webkit-scrollbar-thumb {
		background: oklch(var(--bc) / 0.2);
		border-radius: 2px;
	}

	.max-h-40::-webkit-scrollbar-thumb:hover {
		background: oklch(var(--bc) / 0.3);
	}
</style>
