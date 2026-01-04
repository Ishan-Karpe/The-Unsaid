<!--
  Landing Page - The first impression of The Unsaid
  Designed for emotional resonance, clear value proposition, and trust
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/services/supabase';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	let heroVisible = $state(false);
	let coreValuesVisible = $state(false);
	let demoVisible = $state(false);
	let trustVisible = $state(false);
	let ctaVisible = $state(false);

	// Typing animation state
	let typedText = $state('');
	const fullText =
		"I was hurt when you didn't call. It felt like... you didn't care about my news.";
	let typingComplete = $state(false);

	onMount(async () => {
		// Check if user has "remember me" enabled and is logged in
		const rememberMe = localStorage.getItem('unsaid_remember_me') === 'true';
		if (rememberMe) {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				// User is logged in and wants to be remembered - redirect to /write
				goto(resolve('/write'));
				return;
			}
		}

		heroVisible = true;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (entry.target.id === 'core-values-section') {
							coreValuesVisible = true;
						} else if (entry.target.id === 'demo-section') {
							demoVisible = true;
							// Start typing animation when demo section is visible
							startTypingAnimation();
						} else if (entry.target.id === 'trust-section') {
							trustVisible = true;
						} else if (entry.target.id === 'cta-section') {
							ctaVisible = true;
						}
					}
				});
			},
			{ threshold: 0.15 }
		);

		const sections = ['core-values-section', 'demo-section', 'trust-section', 'cta-section'];

		sections.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	});

	function startTypingAnimation() {
		if (typingComplete) return;
		let index = 0;
		const interval = setInterval(() => {
			if (index < fullText.length) {
				typedText = fullText.slice(0, index + 1);
				index++;
			} else {
				clearInterval(interval);
				typingComplete = true;
			}
		}, 40);
	}
</script>

<svelte:head>
	<title>The Unsaid - Say What You Need to Say</title>
	<meta
		name="description"
		content="The AI-powered safe space to articulate your deepest thoughts, difficult conversations, and unsaid feelings. End-to-end encrypted and private."
	/>
</svelte:head>

<!-- Navigation -->
<nav
	class="navbar fixed top-0 z-50 border-b border-base-content/10 bg-base-300/95 backdrop-blur-md"
>
	<div class="container mx-auto px-4">
		<div class="flex w-full items-center justify-between">
			<!-- Logo -->
			<a href={resolve('/')} class="flex items-center gap-2 text-xl font-bold">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-primary"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
					/>
				</svg>
				<span class="text-base-content">The Unsaid</span>
			</a>

			<!-- Center Navigation -->
			<div class="hidden gap-8 md:flex">
				<a
					href="#core-values-section"
					class="link text-sm text-base-content/70 link-hover transition-colors hover:text-base-content"
					>Mission</a
				>
				<a
					href="#trust-section"
					class="link text-sm text-base-content/70 link-hover transition-colors hover:text-base-content"
					>Privacy</a
				>
			</div>

			<!-- Auth Buttons & Theme Toggle -->
			<div class="flex items-center gap-2">
				<ThemeToggle class="btn-sm" />
				<a href={resolve('/login')} class="btn hidden btn-ghost btn-sm sm:inline-flex">Log in</a>
				<a href={resolve('/signup')} class="btn btn-sm btn-primary">Start Writing</a>
			</div>
		</div>
	</div>
</nav>

<!-- Hero Section -->
<section
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-base-300 via-base-300 to-base-200 pt-16"
>
	<!-- Animated background gradient orbs -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="animate-float-slow absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"
		></div>
		<div
			class="animate-float-slower absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"
		></div>
		<div
			class="animate-float-slow absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-purple-600/5 blur-3xl"
		></div>
	</div>

	<div class="relative z-10 container mx-auto px-4 py-20 text-center">
		<!-- Trust Badge -->
		<div
			class="fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-base-content/20 bg-base-content/5 px-4 py-2 {heroVisible
				? 'visible'
				: ''}"
		>
			<span class="h-2 w-2 animate-pulse rounded-full bg-success"></span>
			<span class="text-sm font-medium tracking-wider text-base-content/80"
				>PRIVATE. SECURE. JUDGMENT-FREE.</span
			>
		</div>

		<!-- Main Heading -->
		<h1
			class="fade-in stagger-1 mb-6 text-4xl leading-tight font-bold tracking-tight md:text-6xl lg:text-7xl {heroVisible
				? 'visible'
				: ''}"
		>
			<span class="text-base-content">Say What You</span>
			<br />
			<span
				class="bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text text-transparent"
				>Need to Say</span
			>
		</h1>

		<!-- Subheadline -->
		<p
			class="fade-in stagger-2 mx-auto mb-10 max-w-xl text-lg text-base-content/60 md:text-xl {heroVisible
				? 'visible'
				: ''}"
		>
			The AI-powered safe space to articulate your deepest thoughts, difficult conversations, and
			unsaid feelings.
		</p>

		<!-- CTA Button -->
		<div class="fade-in stagger-3 mb-6 {heroVisible ? 'visible' : ''}">
			<a
				href={resolve('/signup')}
				class="btn btn-cta-lg gap-2 shadow-lg shadow-primary/25 transition-all duration-300 btn-lg btn-primary hover:shadow-xl hover:shadow-primary/30"
			>
				Draft Your Message
			</a>
		</div>

		<!-- Encryption Note -->
		<div
			class="fade-in stagger-4 flex items-center justify-center gap-2 text-sm text-base-content/50 {heroVisible
				? 'visible'
				: ''}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>End-to-end encrypted & private</span>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 text-base-content/30"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 14l-7 7m0 0l-7-7m7 7V3"
			/>
		</svg>
	</div>
</section>

<!-- Core Values Section -->
<section id="core-values-section" class="bg-base-200 py-24">
	<div class="container mx-auto px-4">
		<div class="fade-in mb-16 {coreValuesVisible ? 'visible' : ''}">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Core Values</h2>
			<p class="text-base-content/60">
				Tools designed to help you communicate with clarity and confidence.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<!-- AI-Assisted Clarity -->
			<div
				class="fade-in stagger-1 card bg-gradient-to-br from-base-300/50 to-purple-500/5 transition-all duration-300 card-border hover:from-base-300 hover:to-purple-500/10 hover:shadow-lg hover:shadow-purple-500/5 {coreValuesVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-purple-500"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
							/>
						</svg>
					</div>
					<h3 class="card-title text-lg">AI-Assisted Clarity</h3>
					<p class="text-sm text-base-content/60">
						Turn messy emotions into clear communication. Our AI helps refine your raw thoughts into
						coherent messages.
					</p>
				</div>
			</div>

			<!-- Privacy First -->
			<div
				class="fade-in stagger-2 card bg-gradient-to-br from-base-300/50 to-violet-500/5 transition-all duration-300 card-border hover:from-base-300 hover:to-violet-500/10 hover:shadow-lg hover:shadow-violet-500/5 {coreValuesVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-violet-500"
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
					<h3 class="card-title text-lg">Privacy First</h3>
					<p class="text-sm text-base-content/60">
						Your words never leave your browser until you choose to send them. We prioritize local
						processing.
					</p>
				</div>
			</div>

			<!-- Emotional Intelligence -->
			<div
				class="fade-in stagger-3 card bg-gradient-to-br from-base-300/50 to-fuchsia-500/5 transition-all duration-300 card-border hover:from-base-300 hover:to-fuchsia-500/10 hover:shadow-lg hover:shadow-fuchsia-500/5 {coreValuesVisible
					? 'visible'
					: ''}"
			>
				<div class="card-body">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-fuchsia-500"
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
					<h3 class="card-title text-lg">Emotional Intelligence</h3>
					<p class="text-sm text-base-content/60">
						Real-time tone checks ensure your message lands exactly how you intend, preserving
						relationships.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Demo Section - From Messy Thoughts to Clear Words -->
<section id="demo-section" class="bg-base-300 py-24">
	<div class="container mx-auto px-4">
		<div class="grid items-center gap-12 lg:grid-cols-2">
			<!-- Left Content -->
			<div class="fade-in {demoVisible ? 'visible' : ''}">
				<h2 class="mb-4 text-3xl font-bold md:text-4xl">
					From Messy Thoughts to
					<br />
					<span
						class="bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text text-transparent"
						>Clear Words</span
					>
				</h2>
				<p class="mb-8 text-base-content/60">
					See how The Unsaid transforms scattered feelings into articulate, meaningful messages in
					real-time. It's not just editing; it's translating your heart.
				</p>

				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
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
						<div>
							<h4 class="font-semibold">Safe Drafting Environment</h4>
							<p class="text-sm text-base-content/60">
								A calm, dark interface designed to reduce anxiety while you write.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3 w-3 text-primary"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div>
							<h4 class="font-semibold">Contextual Suggestions</h4>
							<p class="text-sm text-base-content/60">
								Get prompts based on the emotional undertone of your draft.
							</p>
						</div>
					</div>
				</div>

				<a href={resolve('/signup')} class="btn mt-8 gap-2 pl-0 btn-link btn-primary">
					Try Interactive Demo
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
			</div>

			<!-- Right - Demo Mockup -->
			<div class="fade-in stagger-2 {demoVisible ? 'visible' : ''}">
				<div class="mockup-browser border border-base-content/10 bg-base-100 shadow-2xl">
					<!-- Browser toolbar dots -->
					<div class="mockup-browser-toolbar">
					</div>

					<!-- Demo Content -->
					<div class="bg-base-200 p-6">
						<!-- Recipient Field -->
						<div class="mb-4">
							<span
								class="mb-1 block text-xs font-medium tracking-wider text-base-content/40 uppercase"
								>Recipient</span
							>
							<div
								class="rounded-lg border border-base-content/10 bg-base-300 px-4 py-3 text-base-content"
							>
								Ishan
							</div>
						</div>

						<!-- Draft Field -->
						<div class="mb-4">
							<span
								class="mb-1 block text-xs font-medium tracking-wider text-base-content/40 uppercase"
								>Draft</span
							>
							<div
								class="min-h-[120px] rounded-lg border border-base-content/10 bg-base-300 px-4 py-3"
							>
								<p class="text-base-content">
									{typedText}
									{#if !typingComplete}
										<span class="animate-blink ml-0.5 inline-block h-5 w-0.5 bg-primary"></span>
									{/if}
								</p>
								{#if typingComplete}
									<span
										class="mt-2 inline-block rounded bg-primary/20 px-2 py-0.5 text-sm text-primary"
										>you didn't care about my news.</span
									>
								{/if}
							</div>
						</div>

						<!-- AI Suggestion -->
						{#if typingComplete}
							<div class="animate-fadeIn rounded-lg border border-primary/20 bg-primary/5 p-4">
								<div class="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
										/>
									</svg>
									Softer phrasing suggestion:
								</div>
								<p class="text-sm text-base-content/70">
									"I felt disappointed when we didn't connect, as I was really excited to share my
									news with you."
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Trust Section - Built on Trust -->
<section id="trust-section" class="bg-base-200 py-24">
	<div class="container mx-auto px-4">
		<div class="fade-in mx-auto mb-16 max-w-2xl text-center {trustVisible ? 'visible' : ''}">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Built on Trust</h2>
			<p class="text-base-content/60">
				We believe a safe space requires absolute security. Your privacy is our priority, not an
				afterthought.
			</p>
		</div>

		<div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
			<!-- No Data Storage -->
			<div class="fade-in stagger-1 text-center {trustVisible ? 'visible' : ''}">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 text-base-content/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 font-semibold">No Data Storage</h3>
				<p class="text-sm text-base-content/60">
					We never store your drafts or conversations. Once you close the tab, it's gone from us.
				</p>
			</div>

			<!-- End-to-End Encryption -->
			<div class="fade-in stagger-2 text-center {trustVisible ? 'visible' : ''}">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 text-base-content/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 font-semibold">End-to-End Encryption</h3>
				<p class="text-sm text-base-content/60">
					Your data is encrypted locally on your device before it ever touches our processing
					servers.
				</p>
			</div>

			<!-- Zero Judgment -->
			<div class="fade-in stagger-3 text-center {trustVisible ? 'visible' : ''}">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 text-base-content/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 font-semibold">Zero Judgment</h3>
				<p class="text-sm text-base-content/60">
					An unbiased digital environment designed solely to help you express yourself freely.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Final CTA Section -->
<section id="cta-section" class="bg-base-300 py-24">
	<div class="container mx-auto px-4">
		<div class="fade-in mx-auto max-w-2xl text-center {ctaVisible ? 'visible' : ''}">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">Ready to find your words?</h2>
			<p class="mb-10 text-base-content/60">
				Join thousands of people using The Unsaid to improve their relationships and mental clarity.
			</p>
			<a
				href={resolve('/signup')}
				class="btn btn-cta-lg shadow-lg shadow-primary/25 transition-all duration-300 btn-lg btn-primary hover:shadow-xl hover:shadow-primary/30"
			>
				Start Writing For Free
			</a>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-base-content/10 bg-base-300 py-8">
	<div class="container mx-auto px-4">
		<div class="grid gap-4 text-center md:grid-cols-3 md:items-center">
			<!-- Logo and Copyright -->
			<div class="flex items-center justify-center gap-2 md:justify-self-start">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-primary"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"
					/>
				</svg>
				<span class="text-sm text-base-content/60">The Unsaid &copy; 2026</span>
			</div>

			<div class="text-center text-base-content/50">
				<div class="text-sm">Built by Ishan Karpe</div>
				<div class="text-xs">SvelteKit, Tailwind CSS, DaisyUI, Supabase, FastAPI</div>
			</div>

			<!-- Social Links -->
			<div class="flex items-center justify-center gap-4 md:justify-self-end">
				<a
					href="https://www.linkedin.com/in/ishan-karpe"
					target="_blank"
					rel="noopener noreferrer"
					class="text-base-content/60 transition-colors hover:text-base-content"
					aria-label="LinkedIn"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.036-1.85-3.036-1.85 0-2.134 1.445-2.134 2.939v5.666H9.356V9h3.414v1.561h.048c.477-.9 1.637-1.85 3.37-1.85 3.6 0 4.266 2.368 4.266 5.455v6.286zM5.337 7.433a2.062 2.062 0 11-.004-4.124 2.062 2.062 0 01.004 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
						></path>
					</svg>
				</a>
				<a
					href="https://github.com/Ishan-Karpe"
					target="_blank"
					rel="noopener noreferrer"
					class="text-base-content/60 transition-colors hover:text-base-content"
					aria-label="GitHub"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4 1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22 0 1.6-.02 2.89-.02 3.29 0 .32.22.69.83.57C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"
						></path>
					</svg>
				</a>
				<a
					href="https://www.instagram.com/champconic.ishan"
					target="_blank"
					rel="noopener noreferrer"
					class="text-base-content/60 transition-colors hover:text-base-content"
					aria-label="Instagram"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M12 2.163c3.204 0 3.584.012 4.85.07 1.206.056 1.864.246 2.3.415a4.602 4.602 0 011.675 1.091 4.602 4.602 0 011.091 1.675c.169.436.359 1.094.415 2.3.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.206-.246 1.864-.415 2.3a4.602 4.602 0 01-1.091 1.675 4.602 4.602 0 01-1.675 1.091c-.436.169-1.094.359-2.3.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.206-.056-1.864-.246-2.3-.415a4.602 4.602 0 01-1.675-1.091 4.602 4.602 0 01-1.091-1.675c-.169-.436-.359-1.094-.415-2.3C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.056-1.206.246-1.864.415-2.3a4.602 4.602 0 011.091-1.675A4.602 4.602 0 015.414 2.65c.436-.169 1.094-.359 2.3-.415C8.98 2.175 9.36 2.163 12 2.163m0-2.163C8.741 0 8.332.015 7.052.072 5.775.129 4.702.326 3.78.684c-.957.37-1.77.863-2.584 1.677C.863 3.175.37 3.988 0 4.945c-.358.922-.555 1.995-.612 3.272C-.015 8.332 0 8.741 0 12c0 3.259-.015 3.668.072 4.948.057 1.277.254 2.35.612 3.272.37.957.863 1.77 1.677 2.584.814.814 1.627 1.307 2.584 1.677.922.358 1.995.555 3.272.612C8.332 24.015 8.741 24 12 24c3.259 0 3.668.015 4.948-.072 1.277-.057 2.35-.254 3.272-.612.957-.37 1.77-.863 2.584-1.677.814-.814 1.307-1.627 1.677-2.584.358-.922.555-1.995.612-3.272.087-1.28.072-1.689.072-4.948 0-3.259.015-3.668-.072-4.948-.057-1.277-.254-2.35-.612-3.272-.37-.957-.863-1.77-1.677-2.584C21.77.863 20.957.37 20 .684c-.922-.358-1.995-.555-3.272-.612C15.668-.015 15.259 0 12 0z"
						></path>
						<path
							d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8z"
						></path>
						<circle cx="18.406" cy="5.594" r="1.44"></circle>
					</svg>
				</a>
			</div>
		</div>
	</div>
</footer>

<style>
	/* Fade-in animations */
	.fade-in {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Staggered delays */
	.stagger-1 {
		transition-delay: 0.1s;
	}
	.stagger-2 {
		transition-delay: 0.2s;
	}
	.stagger-3 {
		transition-delay: 0.3s;
	}
	.stagger-4 {
		transition-delay: 0.4s;
	}

	/* Floating animation for background orbs */
	@keyframes float-slow {
		0%,
		100% {
			transform: translateY(0) translateX(0);
		}
		50% {
			transform: translateY(-20px) translateX(10px);
		}
	}

	@keyframes float-slower {
		0%,
		100% {
			transform: translateY(0) translateX(0);
		}
		50% {
			transform: translateY(15px) translateX(-15px);
		}
	}

	:global(.animate-float-slow) {
		animation: float-slow 8s ease-in-out infinite;
	}

	:global(.animate-float-slower) {
		animation: float-slower 12s ease-in-out infinite;
	}

	/* Typing cursor blink */
	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}

	:global(.animate-blink) {
		animation: blink 1s infinite;
	}

	/* Fade in for AI suggestion */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fadeIn) {
		animation: fadeIn 0.5s ease-out forwards;
	}
</style>
