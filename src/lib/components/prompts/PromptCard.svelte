<!--
  PromptCard.svelte - Individual prompt card display
  Shows a prompt with category badge, situation, and use action
  Usage: <PromptCard {prompt} onUse={(id) => {}} showRelationship={true} />
-->
<script lang="ts">
	import type { ConversationPrompt } from '$lib/types';
	import { relationshipLabels, situationLabels } from '$lib/data/prompts';

	interface Props {
		prompt: ConversationPrompt;
		onUse: (promptId: string) => void;
		showRelationship?: boolean;
	}

	let { prompt, onUse, showRelationship = true }: Props = $props();

	// Category colors - background, text, and border accent
	const categoryStyles: Record<string, { badge: string; border: string; glow: string }> = {
		parents: {
			badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
			border: 'border-violet-500/30 hover:border-violet-500/50',
			glow: 'hover:shadow-violet-500/10'
		},
		partners: {
			badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
			border: 'border-pink-500/30 hover:border-pink-500/50',
			glow: 'hover:shadow-pink-500/10'
		},
		friends: {
			badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
			border: 'border-teal-500/30 hover:border-teal-500/50',
			glow: 'hover:shadow-teal-500/10'
		},
		grief: {
			badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
			border: 'border-slate-500/30 hover:border-slate-500/50',
			glow: 'hover:shadow-slate-500/10'
		},
		self: {
			badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
			border: 'border-amber-500/30 hover:border-amber-500/50',
			glow: 'hover:shadow-amber-500/10'
		}
	};

	// Situation badge colors
	const situationStyles: Record<string, string> = {
		appreciation: 'bg-purple-500/20 text-purple-300',
		understanding: 'bg-blue-500/20 text-blue-300',
		apology: 'bg-rose-500/20 text-rose-300',
		honesty: 'bg-orange-500/20 text-orange-300',
		reconnection: 'bg-cyan-500/20 text-cyan-300',
		regret: 'bg-red-500/20 text-red-300',
		legacy: 'bg-indigo-500/20 text-indigo-300',
		healing: 'bg-emerald-500/20 text-emerald-300',
		gratitude: 'bg-violet-500/20 text-violet-300',
		vulnerability: 'bg-pink-500/20 text-pink-300',
		forgiveness: 'bg-lime-500/20 text-lime-300',
		encouragement: 'bg-yellow-500/20 text-yellow-300'
	};

	const styles = $derived(categoryStyles[prompt.relationship] || categoryStyles.self);
	const situationStyle = $derived(
		situationStyles[prompt.situation] || 'bg-base-content/10 text-base-content/70'
	);

	function handleUse() {
		onUse(prompt.id);
	}
</script>

<div
	class="card border bg-base-200/50 shadow-lg transition-all duration-300 hover:shadow-xl {styles.border} {styles.glow}"
>
	<div class="card-body gap-3 p-5">
		<!-- Header with badges and bookmark -->
		<div class="flex items-start justify-between gap-2">
			<div class="flex flex-wrap gap-2">
				{#if showRelationship}
					<span
						class="rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase {styles.badge}"
					>
						{relationshipLabels[prompt.relationship]}
					</span>
				{/if}
				<span class="rounded-full px-3 py-1 text-xs font-medium {situationStyle}">
					{situationLabels[prompt.situation]}
				</span>
			</div>
			<!-- Bookmark icon -->
			<button
				type="button"
				class="text-base-content/30 transition-colors hover:text-primary"
				aria-label="Bookmark prompt"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
					/>
				</svg>
			</button>
		</div>

		<!-- Prompt Text -->
		<p class="text-lg leading-relaxed text-base-content/90 italic">
			"{prompt.text}"
		</p>

		<!-- Footer with action -->
		<div class="mt-auto flex items-center justify-end pt-2">
			<button
				type="button"
				class="btn border-base-content/20 bg-base-100/50 text-base-content btn-sm hover:border-primary hover:bg-primary hover:text-primary-content"
				onclick={handleUse}
			>
				Use Phrase
			</button>
		</div>
	</div>
</div>
