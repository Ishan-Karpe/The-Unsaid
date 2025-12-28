<!--
  Button.svelte - Accessible button component with DaisyUI styling
  Includes proper ARIA attributes, focus management, and loading states

  Usage:
    <Button variant="primary" size="md">Click me</Button>
    <Button loading>Processing...</Button>
    <Button variant="ghost" aria-label="Close">X</Button>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'error' | 'outline';
	type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		/** Visual style variant */
		variant?: ButtonVariant;
		/** Size of the button */
		size?: ButtonSize;
		/** Show loading spinner and disable button */
		loading?: boolean;
		/** Children content */
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
		link: 'btn-link',
		error: 'btn-error',
		outline: 'btn-outline'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		xs: 'btn-xs',
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	// Determine if button is effectively disabled
	const isDisabled = $derived(disabled || loading);
</script>

<button
	class="btn {variantClasses[variant]} {sizeClasses[size]} {className}"
	disabled={isDisabled}
	aria-disabled={isDisabled}
	aria-busy={loading}
	{...restProps}
>
	{#if loading}
		<span class="loading loading-sm loading-spinner" aria-hidden="true"></span>
		<span class="sr-only">Loading...</span>
	{/if}
	{@render children()}
</button>

<style>
	/* Ensure adequate focus visibility for keyboard navigation */
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	/* Screen reader only class for loading announcement */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Ensure minimum touch target size on mobile */
	@media (pointer: coarse) {
		button {
			min-height: 44px;
			min-width: 44px;
		}
	}
</style>
