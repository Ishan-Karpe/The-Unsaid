<!--
  PasswordStrength.svelte - Visual password strength indicator
  Shows strength bar and feedback for missing requirements
-->
<script lang="ts">
	import {
		validatePassword,
		getPasswordStrengthLabel,
		getPasswordStrengthColor
	} from '$lib/utils/validation';

	interface Props {
		password: string;
	}

	let { password }: Props = $props();

	let validation = $derived(validatePassword(password));
	let label = $derived(getPasswordStrengthLabel(validation.score));
	let colorClass = $derived(getPasswordStrengthColor(validation.score));
</script>

<div class="space-y-2">
	<!-- Strength bar -->
	<div class="flex gap-1">
		{#each [0, 1, 2, 3, 4] as i (i)}
			<div
				class="h-1.5 flex-1 rounded-full transition-colors duration-200 {i < validation.score
					? colorClass
					: 'bg-base-300'}"
			></div>
		{/each}
	</div>

	<!-- Label and feedback -->
	<div class="flex flex-wrap items-center justify-between gap-2 text-xs">
		<span class="font-medium text-base-content/70">{label}</span>
		{#if validation.feedback.length > 0}
			<span class="text-warning/80">Missing: {validation.feedback.join(', ')}</span>
		{/if}
	</div>
</div>
