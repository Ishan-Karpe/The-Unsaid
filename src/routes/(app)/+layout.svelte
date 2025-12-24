<!--
  App Layout - Protected routes layout with navigation and user menu
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { authService, keyDerivationService } from '$lib/services';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Get user data from page store (provided by layout server)
	let user = $derived($page.data.user);

	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;

		// Clear encryption key from memory FIRST (critical for security)
		keyDerivationService.clearEncryptionKey();

		await authService.logout();
		await invalidateAll();
		goto(resolve('/login'));
	}

	// Navigation items with resolved hrefs
	const navItems = [
		{ href: resolve('/write'), label: 'Write', icon: 'write' },
		{ href: resolve('/history'), label: 'History', icon: 'history' },
		{ href: resolve('/prompts'), label: 'Prompts', icon: 'prompts' },
		{ href: resolve('/patterns'), label: 'Patterns', icon: 'patterns' },
		{ href: resolve('/settings'), label: 'Settings', icon: 'settings' }
	];
</script>

<div class="min-h-screen bg-base-200">
	<!-- Top Navigation -->
	<nav class="navbar sticky top-0 z-50 bg-base-100 shadow-sm">
		<div class="flex-1">
			<a href={resolve('/write')} class="btn text-xl font-bold text-primary btn-ghost">
				The Unsaid
			</a>
		</div>

		<!-- Desktop Nav -->
		<div class="hidden flex-none md:block">
			<ul class="menu menu-horizontal px-1">
				{#each navItems as item (item.href)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is pre-resolved -->
						<a href={item.href}>{item.label}</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- User Menu (Desktop) -->
		<div class="hidden flex-none md:block">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="placeholder btn avatar btn-circle btn-ghost">
					<div class="w-10 rounded-full bg-primary text-primary-content">
						<span class="text-sm">{user?.email?.charAt(0).toUpperCase() ?? '?'}</span>
					</div>
				</div>
				<ul
					tabindex="0"
					role="menu"
					class="dropdown-content menu z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
				>
					<li class="menu-title">
						<span class="truncate text-xs">{user?.email}</span>
					</li>
					<li>
						<a href={resolve('/settings')}>
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
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Settings
						</a>
					</li>
					<li>
						<button onclick={handleLogout} disabled={loggingOut} class="text-error">
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
							{loggingOut ? 'Logging out...' : 'Log out'}
						</button>
					</li>
				</ul>
			</div>
		</div>

		<!-- Mobile Menu -->
		<div class="flex-none md:hidden">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost">
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
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</div>
				<ul
					tabindex="0"
					role="menu"
					class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					{#each navItems as item (item.href)}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is pre-resolved -->
						<li><a href={item.href}>{item.label}</a></li>
					{/each}
					<li class="divider my-1"></li>
					<li class="menu-title">
						<span class="truncate text-xs">{user?.email}</span>
					</li>
					<li>
						<button onclick={handleLogout} disabled={loggingOut} class="text-error">
							{loggingOut ? 'Logging out...' : 'Log out'}
						</button>
					</li>
				</ul>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="container mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>
</div>
