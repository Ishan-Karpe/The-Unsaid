<!--
  Input.svelte - Accessible text input component with DaisyUI styling
  Includes proper ARIA attributes, error handling, and label association

  Usage:
    <Input bind:value={email} label="Email" type="email" />
    <Input bind:value={name} label="Name" error="Name is required" />
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type InputVariant = 'bordered' | 'ghost';
	type InputSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		/** Label text displayed above the input */
		label?: string;
		/** Error message to display below the input */
		error?: string;
		/** Visual style variant */
		variant?: InputVariant;
		/** Size of the input */
		inputSize?: InputSize;
		/** Current input value (bindable) */
		value?: string;
		/** Hint text displayed below the input (when no error) */
		hint?: string;
	}

	let {
		label,
		error,
		hint,
		variant = 'bordered',
		inputSize = 'md',
		class: className = '',
		id,
		value = $bindable(''),
		required = false,
		...restProps
	}: Props = $props();

	// Generate stable ID for accessibility
	const generatedId = `input-${Math.random().toString(36).slice(2, 9)}`;
	const inputId = $derived(id || generatedId);
	const errorId = $derived(`${inputId}-error`);
	const hintId = $derived(`${inputId}-hint`);

	// Build aria-describedby based on what's present
	const ariaDescribedBy = $derived(
		[error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(' ') || undefined
	);

	const variantClasses: Record<InputVariant, string> = {
		bordered: 'input-bordered',
		ghost: 'input-ghost'
	};

	const sizeClasses: Record<InputSize, string> = {
		xs: 'input-xs',
		sm: 'input-sm',
		md: '',
		lg: 'input-lg'
	};
</script>

<div class="form-control w-full">
	{#if label}
		<label class="label" for={inputId}>
			<span class="label-text">
				{label}
				{#if required}
					<span class="text-error" aria-hidden="true">*</span>
					<span class="sr-only">(required)</span>
				{/if}
			</span>
		</label>
	{/if}

	<input
		id={inputId}
		bind:value
		class="input {variantClasses[variant]} {sizeClasses[inputSize]} w-full transition-all duration-200 focus-visible:outline-none {error
			? 'input-error'
			: ''} {className}"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={ariaDescribedBy}
		aria-required={required}
		{required}
		{...restProps}
	/>

	{#if error}
		<label class="label" for={inputId}>
			<span id={errorId} class="label-text-alt text-error" role="alert">
				{error}
			</span>
		</label>
	{:else if hint}
		<label class="label" for={inputId}>
			<span id={hintId} class="label-text-alt text-base-content/60">
				{hint}
			</span>
		</label>
	{/if}
</div>

<style>
	/* Ensure minimum height for touch targets */
	input {
		min-height: 44px;
	}

	/* Prevent iOS zoom on focus (font-size must be >= 16px) */
	input {
		font-size: 16px;
	}

	/* Screen reader only class */
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

</style>
