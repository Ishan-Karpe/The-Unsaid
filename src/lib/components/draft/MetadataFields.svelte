<!--
  MetadataFields.svelte - Recipient and intent inputs
  Displays context fields for the draft
  Usage: <MetadataFields />
-->
<script lang="ts">
	import { Input } from '$lib/components';
	import { draftStore } from '$lib/stores/draft.svelte';

	// Local state bound to store
	let recipient = $state(draftStore.draft.recipient);
	let intent = $state(draftStore.draft.intent);

	// Sync to store on change
	function handleRecipientChange() {
		draftStore.setMetadata({ recipient });
	}

	function handleIntentChange() {
		draftStore.setMetadata({ intent });
	}

	// Watch for external draft loads
	$effect(() => {
		recipient = draftStore.draft.recipient;
		intent = draftStore.draft.intent;
	});
</script>

<div class="grid grid-cols-1 gap-4">
	<Input
		bind:value={recipient}
		oninput={handleRecipientChange}
		label="Who are you writing to?"
		placeholder="e.g., Mom, Partner, Friend"
	/>
	<Input
		bind:value={intent}
		oninput={handleIntentChange}
		label="What do you want to express?"
		placeholder="e.g., Gratitude, Apology, Love"
	/>
</div>
