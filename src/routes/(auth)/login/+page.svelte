<!--
  Login Page
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Input } from '$lib/components';
</script>

<svelte:head>
	<title>Login | The Unsaid</title>
</svelte:head>

<div class="mb-4">
	<a
		href={resolve('/')}
		class="inline-flex items-center gap-1 text-sm text-base-content/60 transition-colors hover:text-base-content"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd"
			/>
		</svg>
		Back to home
	</a>
</div>

<h2 class="mb-6 text-xl font-semibold">Welcome back</h2>

<form class="space-y-4">
	<Input type="email" label="Email" placeholder="you@example.com" required />

	<Input type="password" label="Password" placeholder="Your password" required />

	<div class="flex items-center justify-between text-sm">
		<label class="flex cursor-pointer items-center gap-2">
			<input type="checkbox" class="checkbox checkbox-sm" />
			<span>Remember me</span>
		</label>
		<a href={resolve('/forgot-password')} class="link link-primary">Forgot password?</a>
	</div>

	<Button type="submit" class="w-full">Log in</Button>
</form>

<div class="divider">or</div>

<p class="text-center text-sm">
	Don't have an account?
	<a href={resolve('/signup')} class="link link-primary">Sign up</a>
</p>
