<!--
  Auth Layout - Shared layout for login/signup/forgot-password
  Centers content and provides auth-specific styling
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
	<div class="w-full max-w-md">
		<!-- Logo/Brand -->
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-primary">The Unsaid</h1>
			<p class="mt-2 text-base-content/70">Turn feelings into words</p>
		</div>

		<!-- Auth Form Container -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				{@render children()}
			</div>
		</div>

		<!-- Footer -->
		<p class="mt-6 text-center text-sm text-base-content/50">
			Your words are encrypted. We can't read them.
		</p>
	</div>
</div>
