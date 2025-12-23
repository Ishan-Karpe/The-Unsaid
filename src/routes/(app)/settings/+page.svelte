<!--
  Settings Page - User preferences and data controls
-->
<script lang="ts">
	import { Card, Button } from '$lib/components';
</script>

<svelte:head>
	<title>Settings | The Unsaid</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Settings</h1>

	<!-- Theme -->
	<Card title="Appearance">
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-4">
				<span class="label-text">Theme</span>
				<select class="select-bordered select select-sm">
					<option value="system">System</option>
					<option value="light">Light</option>
					<option value="dark">Dark</option>
				</select>
			</label>
		</div>
	</Card>

	<!-- AI Settings -->
	<Card title="AI Assistance">
		<p class="mb-4 text-sm text-base-content/70">
			AI features send your draft text to our servers for processing. Your drafts are never stored
			on our servers.
		</p>
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-4">
				<input type="checkbox" class="toggle toggle-primary" />
				<span class="label-text">Enable AI features</span>
			</label>
		</div>
	</Card>

	<!-- Export -->
	<Card title="Export Your Data">
		<p class="mb-4 text-sm text-base-content/70">
			Download all your drafts in a format you can keep forever.
		</p>
		<div class="flex flex-wrap gap-2">
			<Button variant="ghost" size="sm">Export as JSON</Button>
			<Button variant="ghost" size="sm">Export as Text</Button>
			<Button variant="ghost" size="sm">Export as Markdown</Button>
		</div>
	</Card>

	<!-- Danger Zone -->
	<Card title="Danger Zone" class="border-error">
		<p class="mb-4 text-sm text-base-content/70">These actions cannot be undone.</p>
		<div class="flex flex-wrap gap-2">
			<Button variant="ghost" size="sm" class="text-error">Delete all drafts</Button>
			<Button variant="ghost" size="sm" class="text-error">Delete account</Button>
		</div>
	</Card>

	<!-- Account Info -->
	<Card title="Account">
		<div class="space-y-2 text-sm">
			<p><span class="text-base-content/70">Email:</span> user@example.com</p>
			<p><span class="text-base-content/70">Member since:</span> December 2025</p>
		</div>
		<div class="mt-4">
			<Button variant="ghost" size="sm">Log out</Button>
		</div>
	</Card>
</div>
