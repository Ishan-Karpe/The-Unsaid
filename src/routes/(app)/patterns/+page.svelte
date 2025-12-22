<!--
  Patterns Page - Personal insights from writing history
-->
<script lang="ts">
	import { Card } from '$lib/components';
</script>

<svelte:head>
	<title>Patterns | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Your Patterns</h1>
		<p class="text-base-content/70 mt-1">
			Insights from your writing, computed privately on your device.
		</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card compact class="text-center">
			<p class="text-3xl font-bold text-primary">0</p>
			<p class="text-sm text-base-content/70">Total Drafts</p>
		</Card>
		<Card compact class="text-center">
			<p class="text-3xl font-bold text-primary">0</p>
			<p class="text-sm text-base-content/70">This Month</p>
		</Card>
		<Card compact class="text-center">
			<p class="text-3xl font-bold text-primary">0</p>
			<p class="text-sm text-base-content/70">Avg. Words</p>
		</Card>
		<Card compact class="text-center">
			<p class="text-3xl font-bold text-primary">-</p>
			<p class="text-sm text-base-content/70">Top Recipient</p>
		</Card>
	</div>

	<!-- Empty State -->
	<Card class="text-center py-12">
		<p class="text-base-content/60 mb-2">Start writing to see your patterns</p>
		<p class="text-sm text-base-content/40">
			All pattern analysis happens on your device. Your data stays private.
		</p>
	</Card>
</div>
