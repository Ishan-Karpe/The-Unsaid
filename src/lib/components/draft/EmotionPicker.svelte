<!--
  EmotionPicker.svelte - Emotion/feeling selection component
  Displays feeling buttons with toggle selection
  Usage: <EmotionPicker />
-->
<script lang="ts">
	import { draftStore } from '$lib/stores/draft.svelte';

	interface Emotion {
		value: string;
		label: string;
	}

	interface Props {
		/** Custom emotions list (uses defaults if not provided) */
		emotions?: Emotion[];
		/** Layout direction */
		direction?: 'horizontal' | 'vertical';
		/** Size variant */
		size?: 'sm' | 'md';
	}

	const defaultEmotions: Emotion[] = [
		{ value: 'grateful', label: 'Grateful' },
		{ value: 'anxious', label: 'Anxious' },
		{ value: 'hopeful', label: 'Hopeful' },
		{ value: 'hurt', label: 'Hurt' },
		{ value: 'confused', label: 'Confused' },
		{ value: 'loving', label: 'Loving' },
		{ value: 'frustrated', label: 'Frustrated' },
		{ value: 'relieved', label: 'Relieved' }
	];

	let { emotions = defaultEmotions, direction = 'horizontal', size = 'sm' }: Props = $props();

	// Current emotion from store
	let currentEmotion = $derived(draftStore.draft.emotion);

	/**
	 * Toggle emotion selection
	 */
	function toggleEmotion(value: string) {
		if (currentEmotion === value) {
			draftStore.setMetadata({ emotion: undefined });
		} else {
			draftStore.setMetadata({ emotion: value });
		}
	}

	// Compute classes based on props
	let containerClass = $derived(
		direction === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'
	);

	let buttonSizeClass = $derived(size === 'sm' ? 'btn-sm' : 'btn-md');
</script>

<div class={containerClass}>
	{#each emotions as emotion (emotion.value)}
		<button
			type="button"
			class="btn {buttonSizeClass} {currentEmotion === emotion.value
				? 'btn-primary'
				: 'border-base-content/10 btn-ghost'}"
			onclick={() => toggleEmotion(emotion.value)}
		>
			{emotion.label}
		</button>
	{/each}
</div>
