<!--
  ThemeToggle.svelte - Theme mode toggle with system preference support
  Supports light, dark, and system modes with smooth animations
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		getStoredTheme,
		setAndApplyTheme,
		applyTheme,
		listenToSystemTheme,
		type ThemeMode
	} from '$lib/utils/theme';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let themeMode = $state<ThemeMode>('system');

	onMount(() => {
		// Read initial theme from storage
		themeMode = getStoredTheme();

		// Listen for system theme changes when in 'system' mode
		const cleanup = listenToSystemTheme(() => {
			if (themeMode === 'system') {
				applyTheme('system');
			}
		});

		return cleanup;
	});

	function toggleTheme() {
		if (!browser) return;

		// Cycle through: light -> dark -> system -> light
		if (themeMode === 'light') {
			themeMode = 'dark';
		} else if (themeMode === 'dark') {
			themeMode = 'system';
		} else {
			themeMode = 'light';
		}

		setAndApplyTheme(themeMode);
	}

	let iconType = $derived(themeMode === 'light' ? 'sun' : themeMode === 'dark' ? 'moon' : 'system');

	let ariaLabel = $derived(
		themeMode === 'light'
			? 'Switch to dark mode'
			: themeMode === 'dark'
				? 'Switch to system mode'
				: 'Switch to light mode'
	);
</script>

<button
	onclick={toggleTheme}
	class="btn btn-circle btn-ghost transition-all duration-300 {className}"
	aria-label={ariaLabel}
	title={ariaLabel}
>
	{#if iconType === 'sun'}
		<!-- Sun icon - Light mode -->
		<svg class="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path
				d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
			/>
		</svg>
	{:else if iconType === 'moon'}
		<!-- Moon icon - Dark mode -->
		<svg class="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path
				d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
			/>
		</svg>
	{:else}
		<!-- System icon - Auto mode -->
		<svg
			class="h-5 w-5"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
			/>
		</svg>
	{/if}
</button>
