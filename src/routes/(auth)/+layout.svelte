<!--
  Auth Layout - Shared layout for login/signup/forgot-password
  Centers content and provides auth-specific styling with loading state
-->
<script lang="ts">
	import { navigating } from '$app/stores';
	import { LoadingSpinner } from '$lib/components';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Check if navigating (shows loading during page transitions)
	let isNavigating = $derived($navigating !== null);
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
	<div class="w-full max-w-md">
		<!-- Logo/Brand -->
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-primary">The Unsaid</h1>
			<p class="mt-2 text-base-content/70">Turn feelings into words</p>
		</div>

		<!-- Auth Form Container -->
		<div class="card card-border bg-base-100 shadow-xl">
			<div class="card-body p-6 sm:p-8">
				{#if isNavigating}
					<div class="flex flex-col items-center justify-center py-8">
						<LoadingSpinner size="lg" />
						<p class="mt-4 text-sm text-base-content/70">Loading...</p>
					</div>
				{:else}
					{@render children()}
				{/if}
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-6 text-center text-xs text-base-content/50">
			<div>The Unsaid &copy; 2026 · Built by Ishan Karpe</div>
			<div>SvelteKit, Tailwind CSS, DaisyUI, Supabase, FastAPI</div>
		</div>
	</div>
</div>
