<!--
  Settings Page - Account settings with profile, security, AI preferences, and data privacy
  Design follows the landing page theme with DaisyUI/Tailwind and smooth animations
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		authService,
		keyDerivationService,
		preferencesService,
		exportService,
		draftService,
		passwordChangeService,
		type AIPersonality
	} from '$lib/services';
	import type { ExportFormat } from '$lib/types';
	import {
		getStoredTheme,
		setAndApplyTheme,
		applyTheme,
		listenToSystemTheme,
		type ThemeMode
	} from '$lib/utils/theme';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { supabase } from '$lib/services/supabase';

	// Get user data from page store
	let user = $derived($page.data.user);

	// Avatar state
	let avatarUrl = $state<string | null>(null);
	let uploadingAvatar = $state(false);
	let fileInput: HTMLInputElement;

	// Animation states
	let sectionsVisible = $state(false);
	let rightColumnVisible = $state(false);

	// Form states
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Theme state
	let themePreference = $state<ThemeMode>('system');

	// AI Settings (persisted to Supabase)
	let aiEnabled = $state(false);
	let aiConsentDate = $state<string | null>(null);
	let emotionalAnalysis = $state(true);
	let autosuggestions = $state(true);
	let therapeuticMode = $state(false);
	let aiPersonality = $state<AIPersonality>('empathetic');

	// Preferences loading states
	let preferencesLoading = $state(true);
	let preferencesSaving = $state(false);
	let preferencesError = $state<string | null>(null);

	// Loading states
	let savingProfile = $state(false);
	let updatingPassword = $state(false);
	let exportingData = $state(false);
	let deletingAccount = $state(false);
	let loggingOut = $state(false);

	// Export settings
	let exportFormat = $state<ExportFormat>('json');
	let includeMetadata = $state(true);

	// Delete all data state
	let showDeleteAllModal = $state(false);
	let deleteConfirmText = $state('');
	let deletingAllData = $state(false);

	// Password change progress state
	let passwordChangeProgress = $state('');
	let passwordChangeStep = $state(0);
	let passwordChangeTotalSteps = $state(7);

	// Onboarding state
	let resettingOnboarding = $state(false);

	// Initialize form with user data and load preferences
	onMount(() => {
		// Load theme from localStorage
		themePreference = getStoredTheme();

		// Listen for system theme changes
		const cleanupTheme = listenToSystemTheme(() => {
			if (themePreference === 'system') {
				applyTheme('system');
			}
		});

		if (user?.email) {
			email = user.email;
			// Parse name if available in user metadata
			const metadata = user.user_metadata;
			if (metadata?.first_name) firstName = metadata.first_name;
			if (metadata?.last_name) lastName = metadata.last_name;
			if (metadata?.avatar_url) avatarUrl = metadata.avatar_url;
		}

		// Load preferences from database (async IIFE)
		(async () => {
			if (user?.id) {
				const { preferences, error } = await preferencesService.getPreferences(user.id);
				if (preferences) {
					aiEnabled = preferences.ai_enabled;
					aiConsentDate = preferences.ai_consent_date ?? null;
					emotionalAnalysis = preferences.emotional_analysis;
					autosuggestions = preferences.autosuggestions;
					therapeuticMode = preferences.therapeutic_mode;
					aiPersonality = preferences.ai_personality;
					// Sync theme from preferences if set
					if (preferences.theme) {
						themePreference = preferences.theme as ThemeMode;
						setAndApplyTheme(themePreference);
					}
				}
				if (error) {
					preferencesError = error;
				}
				preferencesLoading = false;
			} else {
				preferencesLoading = false;
			}
		})();

		// Stagger animations
		setTimeout(() => (sectionsVisible = true), 100);
		setTimeout(() => (rightColumnVisible = true), 200);

		return () => {
			cleanupTheme();
		};
	});

	/**
	 * Save a single preference change to the database
	 */
	async function savePreference(
		key: 'emotional_analysis' | 'autosuggestions' | 'therapeutic_mode' | 'ai_personality',
		value: boolean | AIPersonality
	) {
		if (!user?.id) return;

		preferencesSaving = true;
		preferencesError = null;

		const { error } = await preferencesService.updatePreferences(user.id, {
			[key]: value
		});

		if (error) {
			preferencesError = error;
			// Revert the toggle on error
			if (key === 'emotional_analysis') emotionalAnalysis = !value;
			if (key === 'autosuggestions') autosuggestions = !value;
			if (key === 'therapeutic_mode') therapeuticMode = !value;
		}

		preferencesSaving = false;
	}

	/**
	 * Handle toggle changes with auto-save
	 */
	function handleEmotionalAnalysisChange() {
		savePreference('emotional_analysis', emotionalAnalysis);
	}

	function handleAutosuggestionsChange() {
		savePreference('autosuggestions', autosuggestions);
	}

	function handleTherapeuticModeChange() {
		savePreference('therapeutic_mode', therapeuticMode);
	}

	function handlePersonalityChange() {
		savePreference('ai_personality', aiPersonality);
	}

	/**
	 * Handle theme preference change
	 */
	async function handleThemeChange(newTheme: ThemeMode) {
		themePreference = newTheme;
		setAndApplyTheme(newTheme);

		// Also save to database for cross-device sync
		if (user?.id) {
			preferencesSaving = true;
			const { error } = await preferencesService.updatePreferences(user.id, {
				theme: newTheme
			});
			if (error) {
				preferencesError = error;
			}
			preferencesSaving = false;
		}
	}

	/**
	 * Handle AI consent toggle
	 */
	async function handleAIConsentChange() {
		if (!user?.id) return;

		preferencesSaving = true;
		preferencesError = null;

		if (aiEnabled) {
			// User is enabling AI - grant consent
			const { preferences, error } = await preferencesService.enableAI(user.id);
			if (error) {
				preferencesError = error;
				aiEnabled = false; // Revert on error
			} else if (preferences) {
				aiConsentDate = preferences.ai_consent_date ?? null;
				toastStore.success('AI features enabled');
			}
		} else {
			// User is disabling AI - revoke consent
			const { error } = await preferencesService.disableAI(user.id);
			if (error) {
				preferencesError = error;
				aiEnabled = true; // Revert on error
			} else {
				toastStore.info('AI features disabled');
			}
		}

		preferencesSaving = false;
	}

	/**
	 * Format consent date for display
	 */
	function formatConsentDate(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Get user initials for avatar
	let initials = $derived.by(() => {
		if (firstName && lastName) {
			return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
		}
		if (user?.email) {
			return user.email.charAt(0).toUpperCase();
		}
		return '?';
	});

	async function handleLogout() {
		loggingOut = true;
		keyDerivationService.clearEncryptionKey();
		await authService.logout();
		await invalidateAll();
		goto(resolve('/login'));
	}

	/**
	 * Handle avatar file selection and upload to Supabase storage
	 */
	async function handleAvatarUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toastStore.error('Please select an image file');
			return;
		}

		// Validate file size (2MB max)
		const MAX_SIZE = 2 * 1024 * 1024; // 2MB
		if (file.size > MAX_SIZE) {
			toastStore.error('Image must be less than 2MB');
			return;
		}

		if (!user?.id) {
			toastStore.error('User not found');
			return;
		}

		uploadingAvatar = true;

		try {
			// Generate unique filename with user ID
			const fileExt = file.name.split('.').pop();
			const fileName = `${user.id}/avatar.${fileExt}`;

			// Upload to Supabase storage
			const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
				cacheControl: '3600',
				upsert: true
			});

			if (uploadError) {
				throw uploadError;
			}

			// Get public URL
			const {
				data: { publicUrl }
			} = supabase.storage.from('avatars').getPublicUrl(fileName);

			// Add cache-busting query param to force refresh
			const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

			// Update user metadata with avatar URL
			const { error: updateError } = await supabase.auth.updateUser({
				data: { avatar_url: urlWithCacheBust }
			});

			if (updateError) {
				throw updateError;
			}

			// Refresh session to get updated user metadata for the layout
			await supabase.auth.refreshSession();

			avatarUrl = urlWithCacheBust;
			await invalidateAll();
			toastStore.success('Profile picture updated');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to upload image';
			toastStore.error(message);
		} finally {
			uploadingAvatar = false;
			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}

	async function saveProfile() {
		savingProfile = true;

		try {
			const { error } = await supabase.auth.updateUser({
				data: {
					first_name: firstName,
					last_name: lastName
				}
			});

			if (error) {
				throw error;
			}

			// Refresh session to get updated user metadata for the layout
			await supabase.auth.refreshSession();

			await invalidateAll();
			toastStore.success('Profile updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update profile';
			toastStore.error(message);
		} finally {
			savingProfile = false;
		}
	}

	async function updatePassword() {
		if (newPassword !== confirmPassword) {
			toastStore.error('Passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			toastStore.error('New password must be at least 6 characters');
			return;
		}

		if (!user?.id) {
			toastStore.error('User not found');
			return;
		}

		updatingPassword = true;
		passwordChangeProgress = 'Starting password change...';
		passwordChangeStep = 0;

		const { success, error, draftsReEncrypted } = await passwordChangeService.changePassword(
			user.id,
			currentPassword,
			newPassword,
			(stage, current, total) => {
				passwordChangeProgress = stage;
				passwordChangeStep = current;
				passwordChangeTotalSteps = total;
			}
		);

		if (success) {
			toastStore.success(
				draftsReEncrypted > 0
					? `Password updated successfully. ${draftsReEncrypted} draft(s) re-encrypted.`
					: 'Password updated successfully.'
			);
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} else {
			toastStore.error(error || 'Failed to update password');
		}

		passwordChangeProgress = '';
		updatingPassword = false;
	}

	async function exportData() {
		exportingData = true;
		const { error } = await exportService.exportAllDrafts({
			format: exportFormat,
			includeMetadata,
			scope: 'all'
		});

		if (error) {
			toastStore.error(`Export failed: ${error}`);
		} else {
			toastStore.success('Drafts exported successfully');
		}
		exportingData = false;
	}

	async function handleDeleteAllData() {
		if (deleteConfirmText.toLowerCase() !== 'delete all') {
			toastStore.error('Please type "delete all" to confirm');
			return;
		}

		deletingAllData = true;

		// Get all drafts first
		const { drafts, error: fetchError } = await draftService.getDrafts();
		if (fetchError) {
			toastStore.error(`Failed to fetch drafts: ${fetchError}`);
			deletingAllData = false;
			return;
		}

		// Delete each draft permanently
		let successCount = 0;
		let failCount = 0;

		for (const draft of drafts) {
			if (draft.id) {
				const { error } = await draftService.permanentlyDeleteDraft(draft.id);
				if (error) {
					failCount++;
				} else {
					successCount++;
				}
			}
		}

		// Also delete any drafts in trash
		const { drafts: trashedDrafts } = await draftService.getDeletedDrafts();
		for (const draft of trashedDrafts || []) {
			if (draft.id) {
				await draftService.permanentlyDeleteDraft(draft.id);
			}
		}

		if (failCount > 0) {
			toastStore.warning(`Deleted ${successCount} drafts, ${failCount} failed`);
		} else {
			toastStore.success(`Successfully deleted all ${successCount} drafts`);
		}

		showDeleteAllModal = false;
		deleteConfirmText = '';
		deletingAllData = false;
	}

	async function deleteAccount() {
		if (
			!confirm(
				'Are you sure you want to delete your account? This action cannot be undone. All your drafts, preferences, and data will be permanently deleted.'
			)
		) {
			return;
		}

		deletingAccount = true;

		// Clear encryption key first
		keyDerivationService.clearEncryptionKey();

		// Call the account deletion service
		const { error } = await authService.deleteAccount();

		if (error) {
			toastStore.error(`Failed to delete account: ${error}`);
			deletingAccount = false;
			return;
		}

		// Invalidate session and redirect to login
		await invalidateAll();
		goto(resolve('/login'));
	}

	/**
	 * Restart onboarding - reset onboarding state and redirect to onboarding page
	 */
	async function handleRestartOnboarding() {
		if (!user?.id) {
			toastStore.error('User not found');
			return;
		}

		resettingOnboarding = true;

		const { error } = await preferencesService.resetOnboarding(user.id);

		if (error) {
			toastStore.error('Failed to reset onboarding: ' + error);
			resettingOnboarding = false;
			return;
		}

		// Navigate to onboarding
		goto(resolve('/onboarding'));
	}
</script>

<svelte:head>
	<title>Settings | The Unsaid</title>
</svelte:head>

<div class="min-h-screen pb-12">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="fade-in {sectionsVisible ? 'visible' : ''}">
			<h1 class="text-3xl font-bold tracking-tight md:text-4xl">Account Settings</h1>
			<p class="mt-2 text-base-content/60">
				Manage your profile details, security preferences, and data privacy.
			</p>
		</div>
		<button
			onclick={handleLogout}
			disabled={loggingOut}
			class="btn gap-2 self-start transition-all duration-300 btn-outline hover:scale-105"
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
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			{loggingOut ? 'Signing Out...' : 'Sign Out'}
		</button>
	</div>

	<!-- Main Content Grid -->
	<div class="grid gap-6 lg:grid-cols-[1fr,380px]">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- Profile Information Card -->
			<div
				class="fade-in stagger-1 card overflow-hidden border border-base-content/10 bg-base-100 shadow-lg {sectionsVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-base-content/70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						<h2 class="card-title text-lg">Profile Information</h2>
					</div>

					<div class="flex flex-col gap-6 sm:flex-row sm:items-center">
						<!-- Avatar -->
						<div class="relative flex-shrink-0 self-center sm:self-auto">
							<!-- Hidden file input -->
							<input
								type="file"
								accept="image/*"
								class="hidden"
								bind:this={fileInput}
								onchange={handleAvatarUpload}
							/>
							{#if avatarUrl}
								<img src={avatarUrl} alt="Profile" class="h-20 w-20 rounded-full object-cover" />
							{:else}
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-base-300 text-2xl font-bold text-base-content/70"
								>
									{initials}
								</div>
							{/if}
							<button
								type="button"
								onclick={() => fileInput?.click()}
								disabled={uploadingAvatar}
								class="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Change avatar"
							>
								{#if uploadingAvatar}
									<span class="loading loading-xs loading-spinner"></span>
								{:else}
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
											d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								{/if}
							</button>
						</div>

						<!-- Form Fields -->
						<div class="flex-1 space-y-4">
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label
										for="firstName"
										class="mb-1 block text-xs font-medium tracking-wider text-primary uppercase"
										>First Name</label
									>
									<input
										type="text"
										id="firstName"
										bind:value={firstName}
										placeholder="John"
										class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div>
									<label
										for="lastName"
										class="mb-1 block text-xs font-medium tracking-wider text-primary uppercase"
										>Last Name</label
									>
									<input
										type="text"
										id="lastName"
										bind:value={lastName}
										placeholder="Doe"
										class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>

							<div>
								<label
									for="email"
									class="mb-1 block text-xs font-medium tracking-wider text-primary uppercase"
									>Email Address</label
								>
								<input
									type="email"
									id="email"
									bind:value={email}
									placeholder="john.doe@example.com"
									class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
									disabled
								/>
							</div>
						</div>
					</div>

					<div class="mt-4 card-actions justify-end">
						<button
							onclick={saveProfile}
							disabled={savingProfile}
							class="btn transition-all duration-300 btn-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
						>
							{savingProfile ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>
			</div>

			<!-- Password & Security Card -->
			<div
				class="fade-in stagger-2 card overflow-hidden border border-base-content/10 bg-base-100 shadow-lg {sectionsVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-base-content/70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						<h2 class="card-title text-lg">Password & Security</h2>
					</div>

					<div class="space-y-4">
						<div>
							<label
								for="currentPassword"
								class="mb-1 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
								>Current Password</label
							>
							<input
								id="currentPassword"
								type="password"
								bind:value={currentPassword}
								placeholder="••••••••"
								class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label
									for="newPassword"
									class="mb-1 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
									>New Password</label
								>
								<input
									id="newPassword"
									type="password"
									bind:value={newPassword}
									placeholder="New password"
									class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label
									for="confirmPassword"
									class="mb-1 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
									>Confirm New Password</label
								>
								<input
									id="confirmPassword"
									type="password"
									bind:value={confirmPassword}
									placeholder="Confirm new password"
									class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>
					</div>

					{#if updatingPassword && passwordChangeProgress}
						<div class="mt-4 rounded-lg bg-primary/10 p-3">
							<div class="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
								<span class="loading loading-sm loading-spinner"></span>
								{passwordChangeProgress}
							</div>
							<progress
								class="progress w-full progress-primary"
								value={passwordChangeStep}
								max={passwordChangeTotalSteps}
							></progress>
							<p class="mt-1 text-xs text-base-content/50">
								Step {passwordChangeStep + 1} of {passwordChangeTotalSteps + 1}
							</p>
						</div>
					{/if}

					<div class="mt-4 card-actions justify-end">
						<button
							onclick={updatePassword}
							disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
							class="btn transition-all duration-300 btn-outline hover:scale-105"
						>
							{#if updatingPassword}
								<span class="loading loading-sm loading-spinner"></span>
								Updating...
							{:else}
								Update Password
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Data Privacy & Control Card -->
			<div
				class="fade-in stagger-3 card overflow-hidden border border-base-content/10 bg-base-100 shadow-lg {sectionsVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-primary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
						<h2 class="card-title text-lg">Data Privacy & Control</h2>
					</div>

					<div class="space-y-4">
						<!-- Export Your Data -->
						<div class="rounded-lg bg-base-200/50 p-4">
							<div class="mb-3">
								<h3 class="font-semibold">Export Your Data</h3>
								<p class="text-sm text-base-content/60">
									Download your drafts in your preferred format. All decryption happens locally.
								</p>
							</div>

							<!-- Format Selector -->
							<div class="mb-3">
								<label
									for="exportFormat"
									class="mb-1 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
									>Format</label
								>
								<div class="flex gap-2">
									<button
										type="button"
										class="btn flex-1 gap-1 transition-all btn-sm {exportFormat === 'json'
											? 'btn-primary'
											: 'btn-ghost'}"
										onclick={() => (exportFormat = 'json')}
									>
										<svg
											class="h-3.5 w-3.5"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
											/>
										</svg>
										JSON
									</button>
									<button
										type="button"
										class="btn flex-1 gap-1 transition-all btn-sm {exportFormat === 'txt'
											? 'btn-primary'
											: 'btn-ghost'}"
										onclick={() => (exportFormat = 'txt')}
									>
										<svg
											class="h-3.5 w-3.5"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										TXT
									</button>
									<button
										type="button"
										class="btn flex-1 gap-1 transition-all btn-sm {exportFormat === 'md'
											? 'btn-primary'
											: 'btn-ghost'}"
										onclick={() => (exportFormat = 'md')}
									>
										<svg
											class="h-3.5 w-3.5"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
											/>
										</svg>
										MD
									</button>
								</div>
							</div>

							<!-- Include Metadata Toggle -->
							<div class="mb-4 flex items-center justify-between">
								<div>
									<span class="text-sm font-medium">Include metadata</span>
									<p class="text-xs text-base-content/50">Recipient, intent, emotion, dates</p>
								</div>
								<input
									type="checkbox"
									bind:checked={includeMetadata}
									class="toggle transition-all toggle-primary toggle-sm"
								/>
							</div>

							<!-- Export Button -->
							<button
								onclick={exportData}
								disabled={exportingData}
								class="btn w-full gap-2 transition-all duration-300 btn-outline hover:scale-[1.02]"
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
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								{#if exportingData}
									<span class="loading loading-xs loading-spinner"></span>
									Exporting...
								{:else}
									Export All Drafts
								{/if}
							</button>
						</div>

						<!-- Manage Drafts -->
						<div
							class="flex flex-col gap-4 rounded-lg bg-base-200/50 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<h3 class="font-semibold">Manage Drafts</h3>
								<p class="text-sm text-base-content/60">
									Review your draft history to permanently remove specific items from our encrypted
									servers.
								</p>
							</div>
							<a
								href={resolve('/history')}
								class="btn shrink-0 gap-2 transition-all duration-300 btn-outline btn-sm hover:scale-105"
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
										d="M4 6h16M4 10h16M4 14h16M4 18h16"
									/>
								</svg>
								Review Drafts
							</a>
						</div>

						<!-- Danger Zone -->
						<div class="mt-6 rounded-lg border border-error/30 bg-error/5 p-4">
							<div class="mb-3 flex items-center gap-2 text-error">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<h3 class="font-semibold">Danger Zone</h3>
							</div>

							<!-- Delete All Data -->
							<div
								class="mb-4 flex flex-col gap-2 rounded-lg border border-error/20 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<h4 class="font-medium text-base-content">Delete All Drafts</h4>
									<p class="text-xs text-base-content/60">
										Permanently remove all your drafts including trash. This cannot be undone.
									</p>
								</div>
								<button
									type="button"
									onclick={() => (showDeleteAllModal = true)}
									class="btn shrink-0 gap-2 transition-all duration-300 btn-outline btn-sm btn-error hover:scale-105"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
									Delete All
								</button>
							</div>

							<!-- Delete Account -->
							<div
								class="flex flex-col gap-2 rounded-lg border border-error/20 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<h4 class="font-medium text-base-content">Delete Account</h4>
									<p class="text-xs text-base-content/60">
										Permanently delete your account, profile, and all data.
									</p>
								</div>
								<button
									onclick={deleteAccount}
									disabled={deletingAccount}
									class="btn shrink-0 gap-2 transition-all duration-300 btn-outline btn-sm btn-error hover:scale-105"
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
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
									{deletingAccount ? 'Deleting...' : 'Delete Account'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-6">
			<!-- Appearance Card -->
			<div
				class="fade-in card overflow-hidden border border-base-content/10 bg-base-100 shadow-lg {rightColumnVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-2 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-base-content/70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
							/>
						</svg>
						<h2 class="card-title text-lg">Appearance</h2>
					</div>

					<p class="mb-4 text-sm text-base-content/60">
						Customize how The Unsaid looks on your device.
					</p>

					<div>
						<label
							for="themeSelector"
							class="mb-2 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
							>Theme</label
						>
						<div class="flex gap-2">
							<button
								type="button"
								class="btn flex-1 gap-2 transition-all btn-sm {themePreference === 'light'
									? 'btn-primary'
									: 'btn-ghost'}"
								onclick={() => handleThemeChange('light')}
							>
								<svg
									class="h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
									/>
								</svg>
								Light
							</button>
							<button
								type="button"
								class="btn flex-1 gap-2 transition-all btn-sm {themePreference === 'dark'
									? 'btn-primary'
									: 'btn-ghost'}"
								onclick={() => handleThemeChange('dark')}
							>
								<svg
									class="h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
										clip-rule="evenodd"
									/>
								</svg>
								Dark
							</button>
							<button
								type="button"
								class="btn flex-1 gap-2 transition-all btn-sm {themePreference === 'system'
									? 'btn-primary'
									: 'btn-ghost'}"
								onclick={() => handleThemeChange('system')}
							>
								<svg
									class="h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v9.75A1.5 1.5 0 005.25 16.5h13.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z"
										clip-rule="evenodd"
									/>
								</svg>
								System
							</button>
						</div>
						<p class="mt-2 text-xs text-base-content/50">
							{themePreference === 'system'
								? 'Follows your device settings'
								: themePreference === 'dark'
									? 'Always use dark theme'
									: 'Always use light theme'}
						</p>
					</div>
				</div>
			</div>

			<!-- AI Assistance Card -->
			<div
				class="fade-in stagger-1 card overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg {rightColumnVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-2 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-primary"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
							/>
						</svg>
						<h2 class="card-title text-lg text-primary">AI Assistance</h2>
					</div>

					<!-- AI Consent Toggle (Master Switch) -->
					<div class="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium">Enable AI Features</h3>
								<p class="text-xs text-base-content/50">
									Allow AI to help with suggestions and tone analysis.
								</p>
							</div>
							<input
								type="checkbox"
								bind:checked={aiEnabled}
								onchange={handleAIConsentChange}
								disabled={preferencesLoading}
								class="toggle transition-all toggle-primary"
							/>
						</div>
						{#if aiConsentDate}
							<p class="mt-2 text-xs text-base-content/40">
								Consent granted on {formatConsentDate(aiConsentDate)}
							</p>
						{/if}
					</div>

					{#if aiEnabled}
						<p class="mb-4 text-sm text-base-content/60">
							Customize how The Unsaid's AI helps you articulate your feelings. Changes apply
							immediately.
						</p>

						<div class="space-y-4">
							<!-- Emotional Analysis Toggle -->
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-medium">Emotional Analysis</h3>
									<p class="text-xs text-base-content/50">Allow AI to analyze tone & sentiment.</p>
								</div>
								<input
									type="checkbox"
									bind:checked={emotionalAnalysis}
									onchange={handleEmotionalAnalysisChange}
									disabled={preferencesLoading}
									class="toggle transition-all toggle-primary"
								/>
							</div>

							<!-- Autosuggestions Toggle -->
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-medium">Autosuggestions</h3>
									<p class="text-xs text-base-content/50">Suggest phrases while typing.</p>
								</div>
								<input
									type="checkbox"
									bind:checked={autosuggestions}
									onchange={handleAutosuggestionsChange}
									disabled={preferencesLoading}
									class="toggle transition-all toggle-primary"
								/>
							</div>

							<!-- Therapeutic Mode Toggle -->
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-medium">Therapeutic Mode</h3>
									<p class="text-xs text-base-content/50">Focus on processing over polishing.</p>
								</div>
								<input
									type="checkbox"
									bind:checked={therapeuticMode}
									onchange={handleTherapeuticModeChange}
									disabled={preferencesLoading}
									class="toggle transition-all toggle-primary"
								/>
							</div>

							<div class="divider my-2"></div>

							<!-- AI Personality Dropdown -->
							<div>
								<label
									for="aiPersonality"
									class="mb-2 block text-xs font-medium tracking-wider text-base-content/50 uppercase"
									>AI Personality</label
								>
								<select
									id="aiPersonality"
									bind:value={aiPersonality}
									onchange={handlePersonalityChange}
									disabled={preferencesLoading}
									class="select-bordered select w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
								>
									<option value="empathetic">Empathetic & Gentle</option>
									<option value="direct">Direct & Clear</option>
									<option value="supportive">Supportive & Encouraging</option>
									<option value="neutral">Neutral & Professional</option>
								</select>

								<!-- Saving indicator and error display -->
								{#if preferencesSaving}
									<div class="mt-2 flex items-center gap-1 text-xs text-primary">
										<span class="loading loading-xs loading-spinner"></span>
										Saving...
									</div>
								{/if}

								{#if preferencesError}
									<div class="mt-2 text-xs text-error">
										{preferencesError}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Privacy First Card -->
			<div
				class="fade-in stagger-1 card overflow-hidden border border-secondary/20 bg-base-100 shadow-lg {rightColumnVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-2 flex items-center gap-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-secondary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<h2 class="card-title text-lg">Privacy First</h2>
					</div>

					<p class="text-sm text-base-content/60">
						"The Unsaid" is designed with your privacy at its core. Your emotional data is encrypted
						end-to-end and never shared with third parties.
					</p>

					<a
						href="#privacy"
						class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
					>
						Read Privacy Policy
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
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</a>
				</div>
			</div>

			<!-- Getting Started Card -->
			<div
				class="fade-in stagger-2 card overflow-hidden border border-base-content/10 bg-base-100 shadow-lg {rightColumnVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-2 flex items-center gap-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h2 class="card-title text-lg">Getting Started</h2>
					</div>

					<p class="text-sm text-base-content/60">
						Need a refresher? Restart the onboarding to revisit the introduction, privacy
						explanations, and AI consent options.
					</p>

					<button
						type="button"
						onclick={handleRestartOnboarding}
						disabled={resettingOnboarding}
						class="btn mt-4 gap-2 transition-all duration-300 btn-outline btn-sm hover:scale-105"
					>
						{#if resettingOnboarding}
							<span class="loading loading-xs loading-spinner"></span>
							Redirecting...
						{:else}
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
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Restart Onboarding
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<footer class="mt-12 border-t border-base-content/10 pt-8">
	<div
		class="flex flex-col items-center justify-between gap-4 text-sm text-base-content/50 sm:flex-row"
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 text-primary"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path
					d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
				/>
			</svg>
			<span>&copy; {new Date().getFullYear()} The Unsaid Application.</span>
		</div>
		<nav class="flex flex-wrap justify-center gap-6">
			<a href="#privacy" class="transition-colors hover:text-base-content">Privacy Policy</a>
			<a href="#terms" class="transition-colors hover:text-base-content">Terms of Service</a>
			<a href="#help" class="transition-colors hover:text-base-content">Help Center</a>
		</nav>
	</div>
</footer>

<!-- Delete All Data Confirmation Modal -->
{#if showDeleteAllModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="flex items-center gap-2 text-lg font-bold text-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				Delete All Drafts
			</h3>
			<p class="py-4 text-base-content/70">
				This action will <strong class="text-error">permanently delete</strong> all your drafts, including
				items in trash. This cannot be undone.
			</p>
			<div class="mb-4">
				<label for="deleteConfirmInput" class="mb-2 block text-sm font-medium">
					Type <span class="font-mono text-error">"delete all"</span> to confirm:
				</label>
				<input
					id="deleteConfirmInput"
					type="text"
					bind:value={deleteConfirmText}
					placeholder="delete all"
					class="input-bordered input w-full {deleteConfirmText.toLowerCase() === 'delete all'
						? 'input-error'
						: ''}"
					disabled={deletingAllData}
				/>
			</div>
			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => {
						showDeleteAllModal = false;
						deleteConfirmText = '';
					}}
					disabled={deletingAllData}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn gap-2 btn-error"
					onclick={handleDeleteAllData}
					disabled={deletingAllData || deleteConfirmText.toLowerCase() !== 'delete all'}
				>
					{#if deletingAllData}
						<span class="loading loading-sm loading-spinner"></span>
						Deleting...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Delete All Drafts
					{/if}
				</button>
			</div>
		</div>
		<div
			class="modal-backdrop bg-black/50"
			role="button"
			tabindex="-1"
			onclick={() => !deletingAllData && (showDeleteAllModal = false)}
			onkeydown={(e) => e.key === 'Escape' && !deletingAllData && (showDeleteAllModal = false)}
		></div>
	</div>
{/if}

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

	/* Staggered delays */
	.stagger-1 {
		transition-delay: 0.1s;
	}
	.stagger-2 {
		transition-delay: 0.2s;
	}
	.stagger-3 {
		transition-delay: 0.3s;
	}

	/* Input focus ring animation */
	:global(.input:focus),
	:global(.select:focus) {
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	/* Toggle animation enhancement */
	:global(.toggle) {
		transition: background-color 0.3s ease;
	}

	/* Card hover effect */
	.card {
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-2px);
	}

	/* Button press effect */
	:global(.btn:active:not(:disabled)) {
		transform: scale(0.98);
	}
</style>
