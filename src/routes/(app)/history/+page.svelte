<!--
  History Page - View past drafts
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, Input } from '$lib/components';
</script>

<svelte:head>
	<title>History | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Your Drafts</h1>

	<!-- Search and Filters -->
	<div class="flex flex-col gap-4 md:flex-row">
		<div class="flex-1">
			<Input type="search" placeholder="Search drafts..." />
		</div>
		<select class="select-bordered select w-full md:w-48">
			<option value="">All recipients</option>
			<option>Mom</option>
			<option>Dad</option>
			<option>Partner</option>
		</select>
	</div>

	<!-- Draft List -->
	<div class="space-y-4">
		<!-- Empty State -->
		<Card class="py-12 text-center">
			<p class="mb-4 text-base-content/60">No drafts yet</p>
			<a href={resolve('/write')} class="btn btn-primary">Start Writing</a>
		</Card>

		<!-- Draft cards will be rendered here -->
	</div>
</div>
