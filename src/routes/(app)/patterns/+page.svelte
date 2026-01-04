<!--
  Patterns Page - Personal insights from writing history
  Client-side analytics computed privately on device
  All pattern computation happens after decryption - the server never learns
  recipient names, emotions, or content-derived patterns.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { insightsService } from '$lib/services';
	import type { UserInsights, InsightPeriod } from '$lib/types';

	// Animation states
	let headerVisible = $state(false);
	let statsVisible = $state(false);
	let insightVisible = $state(false);
	let gridVisible = $state(false);
	let recipientsVisible = $state(false);
	let landscapeVisible = $state(false);

	// Data state
	let insights = $state<UserInsights | null>(null);
	let loading = $state(true);
	let initialLoadComplete = $state(false);
	let error = $state<string | null>(null);

	// Time period filter
	let selectedPeriod = $state<InsightPeriod>('7days');
	let isMounted = $state(false);

	// Pre-resolve paths
	const writePath = resolve('/write');
	const historyPath = resolve('/history');

	// Computed values for UI
	let dominantEmotion = $derived(insights?.emotionsExpressed[0] ?? null);
	let topRecipient = $derived(insights?.topRecipients[0] ?? null);
	// Show spinners only during initial load when no data exists
	let showSpinners = $derived(loading && !initialLoadComplete);
	let hasData = $derived(insights && insights.totalDrafts > 0);

	// Calculate percentage change for monthly comparison
	let monthlyChange = $derived.by(() => {
		if (!insights) return null;
		const { draftsThisMonth, draftsLastMonth } = insights;
		if (draftsLastMonth === 0) {
			return draftsThisMonth > 0 ? { percent: 100, direction: 'up' as const } : null;
		}
		const change = ((draftsThisMonth - draftsLastMonth) / draftsLastMonth) * 100;
		return {
			percent: Math.abs(Math.round(change)),
			direction: change >= 0 ? ('up' as const) : ('down' as const)
		};
	});

	// Calculate bar heights for mini chart (normalized to 100%)
	let chartBarHeights = $derived.by(() => {
		if (!insights?.draftsOverTime.length) return [30, 45, 35, 50, 40, 60, 75]; // Placeholder
		const maxCount = Math.max(...insights.draftsOverTime.map((p) => p.count), 1);
		return insights.draftsOverTime
			.slice(-7)
			.map((p) => Math.max(Math.round((p.count / maxCount) * 100), 10));
	});

	// Heatmap intensity classes based on count
	function getHeatmapClass(count: number): string {
		if (count === 0) return 'bg-base-200';
		if (count === 1) return 'bg-primary/25';
		if (count <= 3) return 'bg-primary/50';
		return 'bg-primary/75';
	}

	// Dynamic insight message based on data
	let insightMessage = $derived.by(() => {
		if (!insights || insights.totalDrafts === 0) {
			return {
				title: 'Start writing to discover your',
				highlight: 'patterns',
				subtitle:
					'Your entries will reveal emotional themes, writing habits, and relationship insights over time.'
			};
		}

		// If we have a top recipient with days since last draft
		if (topRecipient && topRecipient.daysSinceLastDraft !== null) {
			const days = topRecipient.daysSinceLastDraft;
			if (days === 0) {
				return {
					title: `You wrote to ${topRecipient.name}`,
					highlight: 'today',
					subtitle: `Keep the connection strong. You've written to them ${topRecipient.count} times.`
				};
			} else if (days === 1) {
				return {
					title: `You last wrote to ${topRecipient.name}`,
					highlight: 'yesterday',
					subtitle: `Maintaining meaningful connections. ${topRecipient.count} messages and counting.`
				};
			} else if (days <= 7) {
				return {
					title: `It's been ${days} days since you wrote to`,
					highlight: topRecipient.name,
					subtitle: `Consider reaching out. You've written to them ${topRecipient.count} times.`
				};
			} else {
				return {
					title: `It's been ${days} days since you wrote to`,
					highlight: topRecipient.name,
					subtitle: `Maybe it's time to reconnect? You've shared ${topRecipient.count} messages with them.`
				};
			}
		}

		// Fallback with writing streak
		if (insights.writingStreak > 0) {
			return {
				title: `You're on a ${insights.writingStreak}-day`,
				highlight: 'writing streak',
				subtitle: `Keep expressing yourself. You've written ${insights.totalWords.toLocaleString()} words total.`
			};
		}

		return {
			title: `You've written ${insights.totalDrafts}`,
			highlight: insights.totalDrafts === 1 ? 'draft' : 'drafts',
			subtitle: `That's ${insights.totalWords.toLocaleString()} words of meaningful expression.`
		};
	});

	// Get emotion progress width
	function getEmotionProgress(): number {
		if (!dominantEmotion || !insights) return 0;
		const total = insights.emotionsExpressed.reduce((sum, e) => sum + e.count, 0);
		return total > 0 ? Math.round((dominantEmotion.count / total) * 100) : 0;
	}

	// Get recipient progress width
	function getRecipientProgress(count: number): number {
		if (!insights?.topRecipients.length) return 0;
		const maxCount = insights.topRecipients[0].count;
		return maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
	}

	// Format number for display
	function formatNumber(num: number): string {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'k';
		}
		return num.toString();
	}

	// Get initial for avatar
	function getInitial(name: string): string {
		return name.charAt(0).toUpperCase();
	}

	onMount(() => {
		// Staggered animations
		setTimeout(() => (headerVisible = true), 100);
		setTimeout(() => (statsVisible = true), 200);
		setTimeout(() => (insightVisible = true), 300);
		setTimeout(() => (gridVisible = true), 400);
		setTimeout(() => (recipientsVisible = true), 500);
		setTimeout(() => (landscapeVisible = true), 600);
		isMounted = true;

		// Listen for encryption key restoration
		const handleKeyRestored = () => {
			loadInsights(selectedPeriod);
		};
		window.addEventListener('encryption-key-restored', handleKeyRestored);

		return () => {
			window.removeEventListener('encryption-key-restored', handleKeyRestored);
		};
	});

	// Effect to reload insights when period changes
	$effect(() => {
		if (!isMounted) return;
		loadInsights(selectedPeriod);
	});

	async function loadInsights(period: InsightPeriod) {
		loading = true;
		error = null;

		const result = await insightsService.getInsights(period);

		if (result.error) {
			error = result.error;
			insights = null;
		} else {
			insights = result.insights;
		}

		loading = false;
		initialLoadComplete = true;
	}
</script>

<svelte:head>
	<title>Patterns | The Unsaid</title>
</svelte:head>

<div class="space-y-6 pb-8">
	<!-- Header Section -->
	<div
		class="fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between {headerVisible
			? 'visible'
			: ''}"
	>
		<div class="page-header mb-0">
			<div class="flex items-center gap-3">
				<h1>Your Patterns</h1>
				<span class="badge gap-1 border-base-content/20 bg-base-content/5 text-xs">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3 w-3"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
							clip-rule="evenodd"
						/>
					</svg>
					CLIENT-SIDE ONLY
				</span>
			</div>
			<p class="text-muted">
				Insights generated privately on your device. No data leaves your browser.
			</p>
		</div>

		<!-- Time Period Filter -->
		<div class="flex gap-1 rounded-lg bg-base-200 p-1">
			<button
				type="button"
				class="btn transition-all duration-200 btn-sm {selectedPeriod === '7days'
					? 'btn-primary'
					: 'btn-ghost'}"
				onclick={() => (selectedPeriod = '7days')}
			>
				Last 7 Days
			</button>
			<button
				type="button"
				class="btn transition-all duration-200 btn-sm {selectedPeriod === 'month'
					? 'btn-primary'
					: 'btn-ghost'}"
				onclick={() => (selectedPeriod = 'month')}
			>
				Last Month
			</button>
			<button
				type="button"
				class="btn transition-all duration-200 btn-sm {selectedPeriod === 'all'
					? 'btn-primary'
					: 'btn-ghost'}"
				onclick={() => (selectedPeriod = 'all')}
			>
				All Time
			</button>
		</div>
	</div>

	<!-- Error State -->
	{#if error}
		<div class="alert alert-error">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 shrink-0"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>{error}</span>
			<button
				type="button"
				class="btn btn-ghost btn-sm"
				onclick={() => loadInsights(selectedPeriod)}
			>
				Retry
			</button>
		</div>
	{/if}

	<!-- Top Stats Row -->
	<div class="fade-in stagger-1 grid gap-4 md:grid-cols-3 {statsVisible ? 'visible' : ''}">
		<!-- Total Words Card -->
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
		>
			<div class="card-body p-5">
				<p class="text-xs font-medium tracking-wider text-base-content/50 uppercase">Total Words</p>
				<div class="mt-1 flex items-baseline gap-2">
					{#if showSpinners}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						<span class="text-3xl font-bold text-base-content">
							{hasData ? formatNumber(insights?.periodWords ?? 0) : '--'}
						</span>
						{#if monthlyChange && hasData}
							<span
								class="badge gap-1 {monthlyChange.direction === 'up'
									? 'bg-success/10 text-success'
									: 'bg-error/10 text-error'} badge-sm"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3 {monthlyChange.direction === 'down' ? 'rotate-180' : ''}"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
										clip-rule="evenodd"
									/>
								</svg>
								{monthlyChange.percent}%
							</span>
						{:else if !hasData}
							<span class="badge gap-1 bg-success/10 badge-sm text-success">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
										clip-rule="evenodd"
									/>
								</svg>
								--%
							</span>
						{/if}
					{/if}
				</div>
				<!-- Mini Chart -->
				<div class="mt-3 flex h-10 items-end gap-1">
					{#each chartBarHeights as height, i (i)}
						<div
							class="flex-1 rounded-t bg-primary/20 transition-all duration-500"
							style="height: {height}%; animation-delay: {i * 50}ms"
						></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Dominant Emotion Card -->
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
		>
			<div class="card-body p-5">
				<p class="text-xs font-medium tracking-wider text-base-content/50 uppercase">
					Dominant Emotion
				</p>
				<div class="mt-1 flex items-center justify-between">
					<div>
						{#if showSpinners}
							<span class="loading loading-sm loading-spinner"></span>
						{:else if dominantEmotion}
							<p class="text-2xl font-bold text-primary capitalize">{dominantEmotion.emotion}</p>
							<p class="text-sm text-base-content/50">{dominantEmotion.count} drafts</p>
						{:else}
							<p class="text-2xl font-bold text-primary">--</p>
							<p class="text-sm text-base-content/50">Start writing to see</p>
						{/if}
					</div>
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-base-200">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 {dominantEmotion ? 'text-primary' : 'text-base-content/30'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
				<!-- Progress bar -->
				<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-base-200">
					<div
						class="h-full rounded-full bg-primary transition-all duration-700"
						style="width: {getEmotionProgress()}%"
					></div>
				</div>
			</div>
		</div>

		<!-- Most Written-To Card -->
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
		>
			<div class="card-body p-5">
				<p class="text-xs font-medium tracking-wider text-base-content/50 uppercase">
					Most Written-To
				</p>
				<div class="mt-1 flex items-center justify-between">
					<div>
						{#if showSpinners}
							<span class="loading loading-sm loading-spinner"></span>
						{:else if topRecipient}
							<p class="text-2xl font-bold text-base-content">{topRecipient.name}</p>
							<a
								href={historyPath}
								class="mt-1 inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
							>
								{topRecipient.count} drafts
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</a>
						{:else}
							<p class="text-2xl font-bold text-base-content">--</p>
							<a
								href={historyPath}
								class="mt-1 inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
							>
								View drafts
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</a>
						{/if}
					</div>
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-base-200">
						{#if topRecipient}
							<span class="text-lg font-bold text-primary">{getInitial(topRecipient.name)}</span>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-base-content/30"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Insight of the Week -->
	<div class="fade-in stagger-2 {insightVisible ? 'visible' : ''}">
		<div
			class="card border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200 shadow-sm transition-all duration-300 hover:shadow-md"
		>
			<div class="card-body p-6">
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div class="flex-1">
						<span class="mb-3 badge gap-1 border-primary/20 bg-primary/10 text-xs text-primary">
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
							INSIGHT OF THE WEEK
						</span>
						<h2 class="text-2xl font-bold text-base-content md:text-3xl">
							{insightMessage.title}
							<span class="text-primary">{insightMessage.highlight}</span>.
						</h2>
						<p class="mt-2 text-base-content/60">
							{insightMessage.subtitle}
						</p>
					</div>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is pre-resolved -->
					<a
						href={writePath}
						class="btn gap-2 shadow-sm transition-all duration-200 btn-primary hover:shadow-md hover:shadow-primary/25"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
							/>
						</svg>
						Start New Entry
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Writing Rhythm & Recipients Row -->
	<div class="fade-in stagger-3 grid gap-4 lg:grid-cols-5 {gridVisible ? 'visible' : ''}">
		<!-- Writing Rhythm (Heatmap) -->
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-3"
		>
			<div class="card-body p-5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-base-content/50"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
								clip-rule="evenodd"
							/>
						</svg>
						<h3 class="font-semibold text-base-content">Writing Rhythm</h3>
					</div>
					<span class="badge badge-ghost badge-sm">
						{selectedPeriod === '7days'
							? 'Last 7 Days'
							: selectedPeriod === 'month'
								? 'Last 30 Days'
								: 'Last 12 Months'}
					</span>
				</div>

				<!-- Activity Grid -->
				<div class="mt-4 overflow-x-auto">
					<div class="grid grid-cols-7 gap-1.5">
						{#if insights?.draftsOverTime}
							{#each insights.draftsOverTime as point, i (point.date)}
								<div
									class="aspect-square w-full min-w-[24px] rounded {getHeatmapClass(
										point.count
									)} transition-all duration-300 hover:ring-2 hover:ring-primary/30"
									style="animation-delay: {i * 20}ms"
									title="{point.label}: {point.count} drafts"
								></div>
							{/each}
						{:else}
							{#each Array.from({ length: 21 }, (_, idx) => idx) as i (i)}
								<div
									class="aspect-square w-full min-w-[24px] rounded bg-base-200 transition-all duration-300 hover:ring-2 hover:ring-primary/30"
									style="animation-delay: {i * 20}ms"
								></div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Legend -->
				<div class="mt-4 flex items-center justify-between text-xs text-base-content/50">
					<span>LESS</span>
					<div class="flex items-center gap-1">
						<div class="h-3 w-3 rounded bg-base-200"></div>
						<div class="h-3 w-3 rounded bg-primary/25"></div>
						<div class="h-3 w-3 rounded bg-primary/50"></div>
						<div class="h-3 w-3 rounded bg-primary/75"></div>
					</div>
					<span>MORE</span>
				</div>
			</div>
		</div>

		<!-- Who You Write To -->
		<div
			class="fade-in stagger-4 card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2 {recipientsVisible
				? 'visible'
				: ''}"
		>
			<div class="card-body p-5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-base-content/50"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
							/>
						</svg>
						<h3 class="font-semibold text-base-content">Who you write to</h3>
					</div>
					<a href={historyPath} class="text-xs text-primary transition-colors hover:text-primary/80"
						>View All</a
					>
				</div>

				<!-- Recipients List or Empty State -->
				<div class="mt-4 space-y-4">
					{#if insights?.topRecipients && insights.topRecipients.length > 0}
						{#each insights.topRecipients.slice(0, 3) as recipient (recipient.name)}
							<div class="flex items-center gap-3">
								<div class="placeholder avatar">
									<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
										<span class="text-xs font-medium text-primary"
											>{getInitial(recipient.name)}</span
										>
									</div>
								</div>
								<div class="flex-1">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-base-content">{recipient.name}</span>
										<span class="text-xs text-base-content/40">{recipient.count}</span>
									</div>
									<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-base-200">
										<div
											class="h-full rounded-full bg-primary transition-all duration-500"
											style="width: {getRecipientProgress(recipient.count)}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="flex items-center gap-3">
							<div class="placeholder avatar">
								<div class="flex h-9 w-9 items-center justify-center rounded-full bg-base-200">
									<span class="text-xs text-base-content/30">?</span>
								</div>
							</div>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-base-content/50">No recipients yet</span>
									<span class="text-xs text-base-content/40">0</span>
								</div>
								<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-base-200">
									<div class="h-full w-0 rounded-full bg-primary"></div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Emotional Landscape -->
	<div class="fade-in stagger-5 {landscapeVisible ? 'visible' : ''}">
		<div
			class="card border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
		>
			<div class="card-body p-5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-base-content/50"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<h3 class="font-semibold text-base-content">Emotional Landscape</h3>
					</div>
					<span class="text-xs text-base-content/50">Frequent keywords</span>
				</div>

				<!-- Keywords Cloud or Empty State -->
				{#if insights?.emotionsExpressed && insights.emotionsExpressed.length > 0}
					<div class="mt-4 flex flex-wrap gap-2">
						{#each insights.emotionsExpressed as emotion (emotion.emotion)}
							<span
								class="badge gap-1 border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary capitalize"
							>
								{emotion.emotion}
								<span class="text-xs text-primary/60">({emotion.count})</span>
							</span>
						{/each}
					</div>
				{:else}
					<div
						class="mt-4 flex min-h-[100px] flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-base-content/10 bg-base-200/30 p-4"
					>
						<p class="text-center text-sm text-base-content/40">
							Start writing to see your emotional patterns and frequent themes appear here.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Fade-in animations matching landing page */
	.fade-in {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.stagger-1 {
		transition-delay: 0.1s;
	}

	.stagger-2 {
		transition-delay: 0.2s;
	}

	.stagger-3 {
		transition-delay: 0.3s;
	}

	.stagger-4 {
		transition-delay: 0.4s;
	}

	.stagger-5 {
		transition-delay: 0.5s;
	}
</style>
