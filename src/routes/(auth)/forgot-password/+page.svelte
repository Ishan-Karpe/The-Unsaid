<!--
  Forgot Password Page
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Reset Password | The Unsaid</title>
</svelte:head>

<h2 class="mb-2 text-xl font-semibold">Reset your password</h2>
<p class="mb-6 text-sm text-base-content/70">
	Enter your email and we'll send you a link to reset your password.
</p>

<form class="space-y-4">
	<Input type="email" label="Email" placeholder="you@example.com" required />

	<Button type="submit" class="w-full">Send reset link</Button>
</form>

<div class="mt-6 text-center">
	<a href={resolve('/login')} class="link text-sm link-primary">Back to login</a>
</div>
