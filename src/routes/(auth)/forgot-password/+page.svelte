<!--
  Forgot Password Page
-->
<script lang="ts">
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Reset Password | The Unsaid</title>
</svelte:head>

<h2 class="text-xl font-semibold mb-2">Reset your password</h2>
<p class="text-base-content/70 text-sm mb-6">
	Enter your email and we'll send you a link to reset your password.
</p>

<form class="space-y-4">
	<Input
		type="email"
		label="Email"
		placeholder="you@example.com"
		required
	/>

	<Button type="submit" class="w-full">
		Send reset link
	</Button>
</form>

<div class="mt-6 text-center">
	<a href="/login" class="link link-primary text-sm">Back to login</a>
</div>
