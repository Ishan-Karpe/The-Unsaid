<!--
  Sign Up Page
-->
<script lang="ts">
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Sign Up | The Unsaid</title>
</svelte:head>

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
