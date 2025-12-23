<!--
  Landing Page - The first impression of The Unsaid
  Emotionally resonant, clear value proposition, simple CTA
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card } from '$lib/components';
	import { onMount } from 'svelte';

	let heroVisible = false;
	let problemsVisible = false;
	let stepsVisible = false;

	onMount(() => {
		heroVisible = true;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (entry.target.id === 'problems-section') {
							problemsVisible = true;
						} else if (entry.target.id === 'steps-section') {
							stepsVisible = true;
						}
					}
				});
			},
			{ threshold: 0.1 }
		);

		const problemsSection = document.getElementById('problems-section');
		const stepsSection = document.getElementById('steps-section');

		if (problemsSection) observer.observe(problemsSection);
		if (stepsSection) observer.observe(stepsSection);

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>The Unsaid - Turn feelings into words</title>
</svelte:head>

<!-- Hero Section -->
<section class="flex min-h-screen flex-col">
	<!-- Navigation -->
	<nav class="navbar sticky top-0 z-50 border-b border-base-200 bg-base-100/80 backdrop-blur-sm">
		<div class="container mx-auto px-4">
			<div class="flex w-full items-center justify-between">
				<span class="text-xl font-bold text-primary">The Unsaid</span>
				<div class="flex gap-2">
					<a href={resolve('/login')} class="btn btn-ghost btn-sm">Log in</a>
					<a href={resolve('/signup')} class="btn btn-sm btn-primary">Get started</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Content -->
	<div class="flex flex-1 items-center">
		<div class="container mx-auto px-4 py-16 md:py-24">
			<div class="mx-auto max-w-3xl text-center">
				<!-- Tagline -->
				<h1
					class="fade-in mb-6 text-4xl leading-tight font-bold md:text-6xl {heroVisible
						? 'visible'
						: ''}"
				>
					<span class="text-base-content">Turn feelings into</span>
					<span class="text-primary"> words</span>
				</h1>

				<!-- Subheadline -->
				<p
					class="fade-in stagger-1 mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-base-content/70 md:text-2xl {heroVisible
						? 'visible'
						: ''}"
				>
					Some things are hard to say. This will help you find the words for the things that matter
					most to the people who matter most.
				</p>

				<!-- CTA -->
				<div
					class="fade-in stagger-2 mb-12 flex flex-col justify-center gap-4 sm:flex-row {heroVisible
						? 'visible'
						: ''}"
				>
					<a href={resolve('/signup')} class="btn btn-lg btn-primary">
						Start writing
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-1 h-5 w-5"
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
					<a href="#problems-section" class="btn btn-ghost btn-lg"> Learn more </a>
				</div>

				<!-- Trust signals -->
				<div
					class="fade-in stagger-3 flex flex-wrap justify-center gap-6 text-sm text-base-content/50 {heroVisible
						? 'visible'
						: ''}"
				>
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-info"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>End-to-end encrypted</span>
					</div>
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-info"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>No ads, ever</span>
					</div>
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-info"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
							/>
						</svg>
						<span>Your voice, not AI's</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div class="animate-bounce pb-8 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mx-auto h-6 w-6 text-base-content/30"
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

<!-- The Problem Section -->
<section class="bg-base-200 py-20" id="problems-section">
	<div class="container mx-auto px-4">
		<div class="fade-in mx-auto mb-16 max-w-3xl text-center {problemsVisible ? 'visible' : ''}">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">The things we never say</h2>
			<p class="text-lg text-base-content/70">
				We carry words we've never spoken. To parents, partners, friends, and sometimes to those no
				longer here.
			</p>
		</div>

		<div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card
				compact
				class="card-hover fade-in stagger-1 text-center {problemsVisible ? 'visible' : ''}"
			>
				<div class="mb-3 text-4xl">😶</div>
				<h3 class="mb-2 font-semibold">Emotional Overwhelm</h3>
				<p class="text-sm text-base-content/70">
					The weight of what we feel paralyzes our ability to express it
				</p>
			</Card>

			<Card
				compact
				class="card-hover fade-in stagger-2 text-center {problemsVisible ? 'visible' : ''}"
			>
				<div class="mb-3 text-4xl">🔍</div>
				<h3 class="mb-2 font-semibold">Vocabulary Poverty</h3>
				<p class="text-sm text-base-content/70">We lack the precise words for nuanced emotions</p>
			</Card>

			<Card
				compact
				class="card-hover fade-in stagger-3 text-center {problemsVisible ? 'visible' : ''}"
			>
				<div class="mb-3 text-4xl">😰</div>
				<h3 class="mb-2 font-semibold">Fear of Inadequacy</h3>
				<p class="text-sm text-base-content/70">Afraid our words won't match what we really mean</p>
			</Card>

			<Card
				compact
				class="card-hover fade-in stagger-4 text-center {problemsVisible ? 'visible' : ''}"
			>
				<div class="mb-3 text-4xl">🚫</div>
				<h3 class="mb-2 font-semibold">Starting Paralysis</h3>
				<p class="text-sm text-base-content/70">
					Not knowing how to begin a vulnerable conversation
				</p>
			</Card>
		</div>
	</div>
</section>

<!-- How It Works Section -->
<section class="py-20" id="steps-section">
	<div class="container mx-auto px-4">
		<div class="fade-in mx-auto mb-16 max-w-3xl text-center {stepsVisible ? 'visible' : ''}">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">How The Unsaid helps</h2>
			<p class="text-lg text-base-content/70">
				A quiet space to find your words, with gentle guidance when you need it.
			</p>
		</div>

		<div class="mx-auto max-w-4xl space-y-12">
			<!-- Step 1 -->
			<div
				class="fade-in stagger-1 flex flex-col items-center gap-8 md:flex-row {stepsVisible
					? 'visible'
					: ''}"
			>
				<div
					class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
				>
					<span class="text-2xl font-bold text-primary">1</span>
				</div>
				<div>
					<h3 class="mb-2 text-xl font-semibold">Start with a prompt or blank page</h3>
					<p class="text-base-content/70">
						Choose from curated conversation starters, or begin with what's on your mind. No
						pressure, no rush.
					</p>
				</div>
			</div>

			<!-- Step 2 -->
			<div
				class="fade-in stagger-2 flex flex-col items-center gap-8 md:flex-row {stepsVisible
					? 'visible'
					: ''}"
			>
				<div
					class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10"
				>
					<span class="text-2xl font-bold text-secondary">2</span>
				</div>
				<div>
					<h3 class="mb-2 text-xl font-semibold">Write in your own voice</h3>
					<p class="text-base-content/70">
						Draft what you want to say. Your words are encrypted before they leave your device. We
						can never read them.
					</p>
				</div>
			</div>

			<!-- Step 3 -->
			<div
				class="fade-in stagger-3 flex flex-col items-center gap-8 md:flex-row {stepsVisible
					? 'visible'
					: ''}"
			>
				<div
					class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent/20"
				>
					<span class="text-2xl font-bold text-accent-content">3</span>
				</div>
				<div>
					<h3 class="mb-2 text-xl font-semibold">Get help finding the right words</h3>
					<p class="text-base-content/70">
						Optional AI assistance offers alternatives, clarifies meaning, or suggests openings. It
						never writes for you. It helps you write better.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Privacy Section -->
<section class="bg-base-200 py-20">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-3xl text-center">
			<div class="mb-8">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-primary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
			</div>
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Privacy you can trust</h2>
			<p class="mb-8 text-lg text-base-content/70">
				Your drafts are encrypted on your device before they're stored. We physically cannot read
				what you write. If you delete your account, everything goes with it.
			</p>
			<div class="flex flex-wrap justify-center gap-4">
				<div class="badge badge-outline badge-lg">End-to-end encrypted</div>
				<div class="badge badge-outline badge-lg">No tracking</div>
				<div class="badge badge-outline badge-lg">No ads</div>
				<div class="badge badge-outline badge-lg">Your data, your control</div>
			</div>
		</div>
	</div>
</section>

<!-- Final CTA Section -->
<section class="py-20">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">What do you need to say?</h2>
			<p class="mb-8 text-lg text-base-content/70">
				If it helps you once, it's done its job. If you never need it again, that means your
				conversations are going well.
			</p>
			<a href={resolve('/signup')} class="btn btn-lg btn-primary"> Start writing — it's free </a>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-base-200 py-8">
	<div class="container mx-auto px-4">
		<div class="text-center text-sm text-base-content/50">
			© 2025 The Unsaid. Turn feelings into words.
		</div>
	</div>
</footer>

<style>
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

	.stagger-1 {
		transition-delay: 0.1s;
	}
	.stagger-2 {
		transition-delay: 0.2s;
	}
	.stagger-3 {
		transition-delay: 0.3s;
	}
</style>
