<!--
  Input.svelte - Reusable text input component with DaisyUI styling
  Usage: <Input bind:value={email} label="Email" type="email" />
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type InputVariant = 'bordered' | 'ghost';
	type InputSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string;
		error?: string;
		variant?: InputVariant;
		inputSize?: InputSize;
		value?: string;
	}

	let {
		label,
		error,
		variant = 'bordered',
		inputSize = 'md',
		class: className = '',
		id,
		value = $bindable(''),
		...restProps
	}: Props = $props();

	// Generate stable ID - use provided id or generate one
	const generatedId = `input-${Math.random().toString(36).slice(2, 9)}`;
	const inputId = $derived(id || generatedId);

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
			<span class="label-text">{label}</span>
		</label>
	{/if}

	<input
		id={inputId}
		bind:value
		class="input {variantClasses[variant]} {sizeClasses[inputSize]} w-full {error
			? 'input-error'
			: ''} {className}"
		{...restProps}
	/>

	{#if error}
		<label class="label" for={inputId}>
			<span class="label-text-alt text-error">{error}</span>
		</label>
	{/if}
</div>
