<!--
  Write Page - Core drafting experience
-->
<script lang="ts">
	import { Card, Textarea, Input, Button } from '$lib/components';
</script>

<svelte:head>
	<title>Write | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Write</h1>
		<div class="flex items-center gap-2 text-sm text-base-content/60">
			<span class="badge badge-ghost">Saved</span>
		</div>
	</div>

	<!-- Metadata Fields -->
	<Card compact>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input
				label="Who are you writing to?"
				placeholder="e.g., Mom, Partner, Friend"
			/>
			<Input
				label="What do you want to express?"
				placeholder="e.g., Gratitude, Apology, Love"
			/>
		</div>
	</Card>

	<!-- Editor -->
	<Card>
		<Textarea
			label="Your message"
			placeholder="Start writing... Take your time. There's no rush."
			rows={12}
			showCount
		/>
	</Card>

	<!-- AI Assistant (placeholder) -->
	<Card title="Need help finding words?" compact>
		<p class="text-base-content/70 text-sm mb-4">
			AI can help you clarify, find alternatives, or adjust the tone of your message.
		</p>
		<div class="flex flex-wrap gap-2">
			<Button variant="ghost" size="sm">Clarify</Button>
			<Button variant="ghost" size="sm">Alternatives</Button>
			<Button variant="ghost" size="sm">Adjust Tone</Button>
			<Button variant="ghost" size="sm">Go Deeper</Button>
			<Button variant="ghost" size="sm">Opening</Button>
		</div>
	</Card>
</div>
