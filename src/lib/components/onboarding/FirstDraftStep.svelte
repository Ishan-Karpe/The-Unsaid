<!--
  FirstDraftStep - Guided first draft experience

  Content:
  - "Who's someone you've been meaning to write to?"
  - Recipient input
  - Intent selection (gratitude, apology, clarity, etc.)
  - Optional starter prompt
-->
<script lang="ts">
	interface Props {
		recipient: string;
		intent: string;
		starterPrompt: string;
		onRecipientChange: (value: string) => void;
		onIntentChange: (value: string) => void;
		onStarterPromptChange: (value: string) => void;
	}

	let {
		recipient,
		intent,
		starterPrompt,
		onRecipientChange,
		onIntentChange,
		onStarterPromptChange
	}: Props = $props();

	// Intent options
	const intents = [
		{ value: 'gratitude', label: 'Gratitude', emoji: '💜' },
		{ value: 'apology', label: 'Apology', emoji: '💙' },
		{ value: 'clarity', label: 'Clarity', emoji: '✨' },
		{ value: 'reconnection', label: 'Reconnection', emoji: '🤝' },
		{ value: 'other', label: 'Other', emoji: '💭' }
	];

	// Starter prompts based on intent
	const starterPrompts: Record<string, string[]> = {
		gratitude: [
			"I've been meaning to tell you how much I appreciate...",
			'I never properly thanked you for...',
			"You probably don't know this, but you really helped me when..."
		],
		apology: [
			"I've been carrying this for a while. I'm sorry for...",
			'I wish I had handled things differently when...',
			'I know I hurt you, and I want you to know...'
		],
		clarity: [
			"There's something I need to be honest about...",
			"I've been struggling to find the words to explain...",
			"I want you to understand how I've been feeling about..."
		],
		reconnection: [
			"It's been too long since we talked. I've been thinking about...",
			'I miss the way things used to be between us...',
			"I'd really like to rebuild our connection because..."
		],
		other: [
			"There's something on my mind that I need to share...",
			"I've been wanting to tell you...",
			''
		]
	};

	// Get prompts for current intent
	let currentPrompts = $derived(starterPrompts[intent] || starterPrompts.other);
</script>

<div class="space-y-5">
	<!-- Recipient Input -->
	<div>
		<label for="recipient" class="mb-2 block text-sm font-medium text-base-content">
			Who are you writing to?
		</label>
		<input
			type="text"
			id="recipient"
			value={recipient}
			oninput={(e) => onRecipientChange((e.target as HTMLInputElement).value)}
			placeholder="e.g., Mom, Alex, My younger self..."
			class="input-bordered input w-full bg-base-200 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
			aria-describedby="recipient-hint"
		/>
		<p id="recipient-hint" class="sr-only">Enter the name of the person you want to write to</p>
	</div>

	<!-- Intent Selection -->
	<fieldset>
		<legend class="mb-2 block text-sm font-medium text-base-content"> What's the intent? </legend>
		<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Select your intent">
			{#each intents as option (option.value)}
				<button
					type="button"
					onclick={() => onIntentChange(option.value)}
					class="btn gap-1 transition-all btn-sm {intent === option.value
						? 'btn-primary'
						: 'border border-base-content/10 btn-ghost'}"
					role="radio"
					aria-checked={intent === option.value}
				>
					<span aria-hidden="true">{option.emoji}</span>
					{option.label}
				</button>
			{/each}
		</div>
	</fieldset>

	<!-- Starter Prompts -->
	{#if intent}
		<fieldset>
			<legend class="mb-2 block text-sm font-medium text-base-content">
				Choose a starting point <span class="text-base-content/50">(optional)</span>
			</legend>
			<div class="space-y-2" role="radiogroup" aria-label="Select a starter prompt">
				{#each currentPrompts as prompt, index (prompt || `blank-${index}`)}
					{#if prompt}
						<button
							type="button"
							onclick={() => onStarterPromptChange(prompt)}
							class="w-full rounded-lg border p-3 text-left text-sm transition-all {starterPrompt ===
							prompt
								? 'border-primary bg-primary/5 text-base-content'
								: 'border-base-content/10 bg-base-200/50 text-base-content/70 hover:border-primary/50 hover:bg-base-200'}"
							role="radio"
							aria-checked={starterPrompt === prompt}
						>
							<span class="mr-2 text-base-content/40" aria-hidden="true">{index + 1}.</span>
							"{prompt}"
						</button>
					{/if}
				{/each}

				<!-- Custom option -->
				<button
					type="button"
					onclick={() => onStarterPromptChange('')}
					class="w-full rounded-lg border p-3 text-left text-sm transition-all {starterPrompt === ''
						? 'border-primary bg-primary/5 text-base-content'
						: 'border-base-content/10 bg-base-200/50 text-base-content/70 hover:border-primary/50 hover:bg-base-200'}"
					role="radio"
					aria-checked={starterPrompt === ''}
				>
					<span class="mr-2 text-base-content/40" aria-hidden="true">✏️</span>
					Start with a blank page
				</button>
			</div>
		</fieldset>
	{/if}

	<!-- Encouragement -->
	<div
		class="rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 p-3 text-center"
		role="note"
	>
		<p class="text-sm text-base-content/60">
			Remember: This is just a draft. No one sees it but you.
		</p>
	</div>
</div>
