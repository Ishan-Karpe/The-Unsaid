<!--
  WelcomeStep - First onboarding screen introducing The Unsaid

  Content:
  - "Some things are hard to say. We're here to help."
  - Value proposition blocks: Why The Unsaid exists
  - Warm, inviting design matching landing page gradients
-->
<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
</script>

<div class="space-y-6">
	<!-- Hero Message -->
	<div
		class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-primary/5 p-6 text-center"
	>
		<!-- Decorative orb -->
		<div
			class="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl"
		></div>

		<div class="relative z-10">
			<!-- Star Icon -->
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Logo size="lg" />
			</div>

			<p class="text-lg font-medium text-base-content">Turn your feelings into words.</p>
			<p class="mt-2 text-sm text-base-content/60">A safe space to articulate what matters most.</p>
		</div>
	</div>

	<!-- Value Propositions -->
	<div class="space-y-3">
		<h3 class="text-center text-xs font-semibold tracking-wider text-base-content/40 uppercase">
			Why The Unsaid exists
		</h3>

		<!-- Value 1: Express difficult emotions -->
		<div class="flex items-start gap-3 rounded-lg bg-base-200/50 p-3">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-purple-500"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<h4 class="font-medium text-base-content">Express difficult emotions</h4>
				<p class="text-sm text-base-content/60">
					Find the right words when feelings overwhelm you.
				</p>
			</div>
		</div>

		<!-- Value 2: AI helps, never replaces -->
		<div class="flex items-start gap-3 rounded-lg bg-base-200/50 p-3">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-violet-500"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
					/>
				</svg>
			</div>
			<div>
				<h4 class="font-medium text-base-content">AI assists, never replaces</h4>
				<p class="text-sm text-base-content/60">
					Your voice stays yours. AI offers suggestions, not substitutions.
				</p>
			</div>
		</div>

		<!-- Value 3: Completely private -->
		<div class="flex items-start gap-3 rounded-lg bg-base-200/50 p-3">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-primary"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<h4 class="font-medium text-base-content">Completely private</h4>
				<p class="text-sm text-base-content/60">
					Your drafts are encrypted end-to-end. We can't read them.
				</p>
			</div>
		</div>
	</div>
</div>
