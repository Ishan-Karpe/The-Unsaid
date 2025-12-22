<!--
  App Layout - Protected routes layout with navigation
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Navigation items
	const navItems = [
		{ href: '/write', label: 'Write', icon: '✏️' },
		{ href: '/history', label: 'History', icon: '📚' },
		{ href: '/prompts', label: 'Prompts', icon: '💡' },
		{ href: '/patterns', label: 'Patterns', icon: '📊' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' },
	];
</script>

<div class="min-h-screen bg-base-200">
	<!-- Top Navigation -->
	<nav class="navbar bg-base-100 shadow-sm sticky top-0 z-50">
		<div class="flex-1">
			<a href="/write" class="btn btn-ghost text-xl font-bold text-primary">
				The Unsaid
			</a>
		</div>

		<!-- Desktop Nav -->
		<div class="flex-none hidden md:block">
			<ul class="menu menu-horizontal px-1">
				{#each navItems as item}
					<li>
						<a href={item.href}>{item.label}</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Mobile Menu -->
		<div class="flex-none md:hidden">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul tabindex="0" role="menu" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
					{#each navItems as item}
						<li><a href={item.href}>{item.icon} {item.label}</a></li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-6 max-w-4xl">
		{@render children()}
	</main>
</div>
