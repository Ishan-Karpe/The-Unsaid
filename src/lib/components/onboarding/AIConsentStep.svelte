<!--
  AIConsentStep - Explicit opt-in for AI features

  Content:
  - "AI can help you find words. It requires sending your draft to process."
  - Bullet list explaining what AI does
  - "Enable AI" / "Not now" options
  - "You can change this later in Settings"
-->
<script lang="ts">
	// No props - parent handles the consent action
</script>

<div class="space-y-6">
	<!-- AI Assistant Icon -->
	<div
		class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-violet-500/5 p-6 text-center"
		role="presentation"
	>
		<!-- Decorative sparkle -->
		<div
			class="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
			aria-hidden="true"
		></div>

		<div class="relative z-10">
			<!-- Star/AI Icon -->
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
				aria-hidden="true"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-primary"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
					/>
				</svg>
			</div>

			<h3 class="text-lg font-bold text-base-content">AI can help you find words</h3>
			<p class="mt-2 text-sm text-base-content/60">
				Enable AI assistance to get suggestions while you write.
			</p>
		</div>
	</div>

	<!-- What AI Does -->
	<div class="space-y-3">
		<h3 class="text-center text-xs font-semibold tracking-wider text-base-content/40 uppercase">
			What AI assistance provides
		</h3>

		<ul class="space-y-2" aria-label="AI features list">
			<!-- Clarify -->
			<li class="flex items-center gap-3 rounded-lg bg-base-200/50 px-3 py-2">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10"
					aria-hidden="true"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3 w-3 text-success"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-sm text-base-content">Clearer phrasing suggestions</span>
			</li>

			<!-- Tone -->
			<li class="flex items-center gap-3 rounded-lg bg-base-200/50 px-3 py-2">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10"
					aria-hidden="true"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3 w-3 text-success"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-sm text-base-content">Tone calibration (softer, warmer, direct)</span>
			</li>

			<!-- Alternatives -->
			<li class="flex items-center gap-3 rounded-lg bg-base-200/50 px-3 py-2">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10"
					aria-hidden="true"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3 w-3 text-success"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-sm text-base-content">Alternative ways to say the same thing</span>
			</li>

			<!-- Expand -->
			<li class="flex items-center gap-3 rounded-lg bg-base-200/50 px-3 py-2">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10"
					aria-hidden="true"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3 w-3 text-success"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-sm text-base-content">Questions to help you go deeper</span>
			</li>
		</ul>
	</div>

	<!-- Privacy Note -->
	<div class="rounded-lg border border-warning/30 bg-warning/5 p-3" role="alert">
		<div class="flex items-start gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mt-0.5 h-4 w-4 shrink-0 text-warning"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
			<div>
				<p class="text-sm text-base-content/70">
					<strong>Note:</strong> AI requires sending your draft text to our AI provider for processing.
					The data is not stored by the AI provider.
				</p>
			</div>
		</div>
	</div>

	<!-- Settings Reminder -->
	<p class="text-center text-xs text-base-content/50">You can change this anytime in Settings.</p>
</div>
