<!--
  Sign Up Page
-->
<script lang="ts">
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Sign Up | The Unsaid</title>
</svelte:head>

<div class="mb-4">
	<a href="/" class="text-sm text-base-content/60 hover:text-base-content inline-flex items-center gap-1 transition-colors">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
		</svg>
		Back to home
	</a>
</div>

<h2 class="text-xl font-semibold mb-6">Create your account</h2>

<form class="space-y-4">
	<Input
		type="email"
		label="Email"
		placeholder="you@example.com"
		required
	/>

	<Input
		type="password"
		label="Password"
		placeholder="Create a strong password"
		required
	/>

	<Input
		type="password"
		label="Confirm Password"
		placeholder="Confirm your password"
		required
	/>

	<!-- Password strength indicator placeholder -->
	<div class="text-xs text-base-content/60">
		Password must be at least 8 characters with uppercase, lowercase, and numbers.
	</div>

	<Button type="submit" class="w-full">
		Create account
	</Button>
</form>

<div class="divider">or</div>

<p class="text-center text-sm">
	Already have an account?
	<a href="/login" class="link link-primary">Log in</a>
</p>
