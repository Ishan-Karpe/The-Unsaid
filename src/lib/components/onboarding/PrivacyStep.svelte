<!--
  PrivacyStep - Explains the zero-knowledge encryption model

  Content:
  - "Your drafts are encrypted. We can't read them."
  - "Your words are yours" callout
  - Visual explanation of encryption flow
-->
<script lang="ts">
	// No props needed - this is purely presentational
</script>

<div class="space-y-6">
	<!-- Main Privacy Callout -->
	<div
		class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-primary/5 to-transparent p-6 text-center"
	>
		<!-- Decorative shield -->
		<div
			class="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl"
		></div>

		<div class="relative z-10">
			<!-- Shield Icon -->
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-success"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					/>
				</svg>
			</div>

			<h3 class="text-lg font-bold text-base-content">Your words are yours</h3>
			<p class="mt-2 text-sm text-base-content/60">
				We believe privacy isn't optional. It's foundational.
			</p>
		</div>
	</div>

	<!-- How It Works -->
	<div class="space-y-3">
		<h3 class="text-center text-xs font-semibold tracking-wider text-base-content/40 uppercase">
			How encryption works
		</h3>

		<!-- Step 1: Local Encryption -->
		<div class="flex items-start gap-3 rounded-lg border border-base-content/10 bg-base-100 p-3">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
			>
				1
			</div>
			<div>
				<h4 class="font-medium text-base-content">Encrypted on your device</h4>
				<p class="text-sm text-base-content/60">
					Your drafts are encrypted with AES-256 before leaving your browser.
				</p>
			</div>
		</div>

		<!-- Step 2: Key Only You Have -->
		<div class="flex items-start gap-3 rounded-lg border border-base-content/10 bg-base-100 p-3">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
			>
				2
			</div>
			<div>
				<h4 class="font-medium text-base-content">Only you hold the key</h4>
				<p class="text-sm text-base-content/60">
					Your password generates the encryption key. We never see it.
				</p>
			</div>
		</div>

		<!-- Step 3: Safe Storage -->
		<div class="flex items-start gap-3 rounded-lg border border-base-content/10 bg-base-100 p-3">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
			>
				3
			</div>
			<div>
				<h4 class="font-medium text-base-content">Stored safely, unreadable to us</h4>
				<p class="text-sm text-base-content/60">
					Even if our servers were breached, your words remain private.
				</p>
			</div>
		</div>
	</div>

	<!-- Trust Badge -->
	<div class="flex items-center justify-center gap-2 rounded-lg bg-base-200/50 px-4 py-3">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4 text-success"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
				clip-rule="evenodd"
			/>
		</svg>
		<span class="text-sm text-base-content/70">
			End-to-end encryption • Zero-knowledge architecture
		</span>
	</div>
</div>
