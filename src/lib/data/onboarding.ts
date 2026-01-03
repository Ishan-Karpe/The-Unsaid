// ===========================================
// THE UNSAID - Onboarding Step Configuration
// ===========================================
// Defines the steps in the onboarding flow
// Order: welcome -> privacy -> ai-consent -> first-draft

/**
 * Onboarding step configuration
 */
export interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	primaryCta: string;
	secondaryCta?: string;
}

/**
 * All onboarding steps in order
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		id: 'welcome',
		title: 'Welcome to The Unsaid',
		description: "Some things are hard to say. We're here to help.",
		primaryCta: 'Continue',
		secondaryCta: 'Skip'
	},
	{
		id: 'privacy',
		title: 'Your Privacy Promise',
		description: "Your drafts are encrypted. We can't read them. Here's how it works.",
		primaryCta: 'Continue',
		secondaryCta: 'Skip'
	},
	{
		id: 'ai-consent',
		title: 'AI Assistance',
		description: 'AI can help you find words. It requires sending your draft to process.',
		primaryCta: 'Enable AI',
		secondaryCta: 'Not now'
	},
	{
		id: 'first-draft',
		title: 'Your First Draft',
		description: "Who's someone you've been meaning to write to?",
		primaryCta: 'Start Writing',
		secondaryCta: 'Skip for now'
	}
];

/**
 * Get the total number of steps
 */
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

/**
 * Get step by index
 */
export function getStep(index: number): OnboardingStep | undefined {
	return ONBOARDING_STEPS[index];
}

/**
 * Get step by id
 */
export function getStepById(id: string): OnboardingStep | undefined {
	return ONBOARDING_STEPS.find((step) => step.id === id);
}

/**
 * Get step index by id
 */
export function getStepIndex(id: string): number {
	return ONBOARDING_STEPS.findIndex((step) => step.id === id);
}
