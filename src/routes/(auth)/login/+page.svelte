<!--
  Login Page
-->
<script lang="ts">
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Login | The Unsaid</title>
</svelte:head>

<h2 class="text-xl font-semibold mb-6">Welcome back</h2>

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
		placeholder="Your password"
		required
	/>

	<div class="flex justify-between items-center text-sm">
		<label class="flex items-center gap-2 cursor-pointer">
			<input type="checkbox" class="checkbox checkbox-sm" />
			<span>Remember me</span>
		</label>
		<a href="/forgot-password" class="link link-primary">Forgot password?</a>
	</div>

	<Button type="submit" class="w-full">
		Log in
	</Button>
</form>

<div class="divider">or</div>

<p class="text-center text-sm">
	Don't have an account?
	<a href="/signup" class="link link-primary">Sign up</a>
</p>
