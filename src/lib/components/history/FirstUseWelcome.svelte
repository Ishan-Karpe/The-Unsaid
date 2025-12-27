<!--
  FirstUseWelcome.svelte - Welcome message for new users
  Shown when user has no drafts yet with encouraging tips
-->
<script lang="ts">
	interface Props {
		onnewdraft: () => void;
	}

	let { onnewdraft }: Props = $props();

	const tips = [
		{
			icon: 'sparkle',
			title: 'Start with the heart',
			text: 'Begin with what you truly want to say, even if it feels messy.'
		},
		{
			icon: 'lock',
			title: 'Your words are private',
			text: 'Everything you write is encrypted. Only you can read your drafts.'
		},
		{
			icon: 'robot',
			title: 'AI helps, not replaces',
			text: 'Our AI suggests refinements, but your authentic voice always leads.'
		}
	];
</script>

<div class="card border border-base-content/10 bg-gradient-to-br from-primary/5 to-secondary/5">
	<div class="card-body items-center py-12 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mb-4 h-16 w-16 text-primary/60"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
			/>
		</svg>

		<h3 class="mb-2 text-xl font-semibold text-base-content">Welcome to The Unsaid</h3>

		<p class="mb-8 max-w-md text-base-content/70">
			This is your private space for the words that matter most. No judgment, no pressure—just you
			and your thoughts.
		</p>

		<!-- Tips grid -->
		<div class="mb-8 grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
			{#each tips as tip (tip.title)}
				<div class="rounded-lg bg-base-100/50 p-4 text-left">
					<div class="mb-2 text-2xl text-primary">
						{#if tip.icon === 'sparkle'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else if tip.icon === 'lock'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
								/>
							</svg>
						{/if}
					</div>
					<h4 class="mb-1 text-sm font-medium">{tip.title}</h4>
					<p class="text-xs text-base-content/60">{tip.text}</p>
				</div>
			{/each}
		</div>

		<button
			type="button"
			onclick={onnewdraft}
			class="btn gap-2 shadow-lg transition-all btn-lg btn-primary hover:shadow-xl"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
				/>
			</svg>
			Write Your First Draft
		</button>

		<p class="mt-4 text-xs text-base-content/40">
			It doesn't have to be perfect. It just has to be real.
		</p>
	</div>
</div>
