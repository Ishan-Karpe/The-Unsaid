<!--
  App Layout - Protected routes layout with navigation
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Navigation items with resolved hrefs
	const navItems = [
		{ href: resolve('/write'), label: 'Write', icon: '✏️' },
		{ href: resolve('/history'), label: 'History', icon: '📚' },
		{ href: resolve('/prompts'), label: 'Prompts', icon: '💡' },
		{ href: resolve('/patterns'), label: 'Patterns', icon: '📊' },
		{ href: resolve('/settings'), label: 'Settings', icon: '⚙️' }
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
						<li><a href={item.href}>{item.icon} {item.label}</a></li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="container mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>
</div>
