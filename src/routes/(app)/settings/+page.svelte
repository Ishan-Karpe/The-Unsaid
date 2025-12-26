<!--
  Settings Page - Account settings with profile, security, AI preferences, and data privacy
  Design follows the landing page theme with DaisyUI/Tailwind and smooth animations
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authService, keyDerivationService } from '$lib/services';

	// Get user data from page store
	let user = $derived($page.data.user);

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

	// AI Settings
	let emotionalAnalysis = $state(true);
	let autosuggestions = $state(true);
	let therapeuticMode = $state(false);
	let aiPersonality = $state('empathetic');

	// Loading states
	let savingProfile = $state(false);
	let updatingPassword = $state(false);
	let exportingData = $state(false);
	let deletingAccount = $state(false);
	let loggingOut = $state(false);

	// Initialize form with user data
	onMount(() => {
		if (user?.email) {
			email = user.email;
			// Parse name if available in user metadata
			const metadata = user.user_metadata;
			if (metadata?.first_name) firstName = metadata.first_name;
			if (metadata?.last_name) lastName = metadata.last_name;
		}

		// Stagger animations
		setTimeout(() => (sectionsVisible = true), 100);
		setTimeout(() => (rightColumnVisible = true), 200);
	});

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

	async function saveProfile() {
		savingProfile = true;
		// TODO: Implement profile update via Supabase
		await new Promise((resolve) => setTimeout(resolve, 1000));
		savingProfile = false;
	}

	async function updatePassword() {
		if (newPassword !== confirmPassword) {
			alert('Passwords do not match');
			return;
		}
		updatingPassword = true;
		// TODO: Implement password update via Supabase
		await new Promise((resolve) => setTimeout(resolve, 1000));
		updatingPassword = false;
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
	}

	async function exportData() {
		exportingData = true;
		// TODO: Implement data export
		await new Promise((resolve) => setTimeout(resolve, 1000));
		exportingData = false;
	}

	async function deleteAccount() {
		if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			return;
		}
		deletingAccount = true;
		// TODO: Implement account deletion
		await new Promise((resolve) => setTimeout(resolve, 1000));
		deletingAccount = false;
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

					<div class="flex flex-col gap-6 sm:flex-row sm:items-start">
						<!-- Avatar -->
						<div class="relative flex-shrink-0">
							<div
								class="flex h-20 w-20 items-center justify-center rounded-full bg-base-300 text-2xl font-bold text-base-content/70"
							>
								{initials}
							</div>
							<button
								class="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-transform hover:scale-110"
								aria-label="Change avatar"
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
										d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
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

					<div class="mt-4 card-actions justify-end">
						<button
							onclick={updatePassword}
							disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
							class="btn transition-all duration-300 btn-outline hover:scale-105"
						>
							{updatingPassword ? 'Updating...' : 'Update Password'}
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
						<div
							class="flex flex-col gap-4 rounded-lg bg-base-200/50 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<h3 class="font-semibold">Export Your Data</h3>
								<p class="text-sm text-base-content/60">
									Download a complete JSON archive of all your drafted messages and personal
									information.
								</p>
							</div>
							<button
								onclick={exportData}
								disabled={exportingData}
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
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								{exportingData ? 'Exporting...' : 'Export JSON'}
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
							<p class="mb-4 text-sm text-base-content/60">
								Once you delete your account, there is no going back. This action will permanently
								erase your profile, all drafts, and AI personalization data.
							</p>
							<button
								onclick={deleteAccount}
								disabled={deletingAccount}
								class="btn gap-2 transition-all duration-300 btn-outline btn-sm btn-error hover:scale-105"
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

		<!-- Right Column -->
		<div class="space-y-6">
			<!-- AI Assistance Card -->
			<div
				class="fade-in card overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg {rightColumnVisible
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
								class="select-bordered select w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								<option value="empathetic">Empathetic & Gentle</option>
								<option value="direct">Direct & Clear</option>
								<option value="supportive">Supportive & Encouraging</option>
								<option value="neutral">Neutral & Professional</option>
							</select>
						</div>
					</div>
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
