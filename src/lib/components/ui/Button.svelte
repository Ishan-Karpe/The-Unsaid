<!--
  Button.svelte - Reusable button component with DaisyUI styling
  Usage: <Button variant="primary" size="md">Click me</Button>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
	type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		loading?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		accent: 'btn-accent',
		ghost: 'btn-ghost',
		link: 'btn-link'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		xs: 'btn-xs',
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};
</script>

<button
	class="btn {variantClasses[variant]} {sizeClasses[size]} {className}"
	disabled={disabled || loading}
	{...restProps}
>
	{#if loading}
		<span class="loading loading-spinner loading-sm"></span>
	{/if}
	{@render children()}
</button>
