// ===========================================
// THE UNSAID - Conversation Prompts Data
// ===========================================
import type { ConversationPrompt, PromptCategory } from '$lib/types';

export interface PhrasePrompt {
	id: string;
	title: string;
	text: string;
	category: PromptCategory;
	uses: number;
}

export const phrasePrompts: PhrasePrompt[] = [
	{
		id: 'p1',
		title: 'Deep Appreciation',
		text: "I wanted to take a moment to express my deepest gratitude for everything you've done...",
		category: 'gratitude',
		uses: 842
	},
	{
		id: 'p2',
		title: 'Sincere Regret',
		text: 'I realize now that my words were hurtful, and for that, I am truly sorry. I hope you can...',
		category: 'apologies',
		uses: 1500
	},
	{
		id: 'p3',
		title: 'Holding Space',
		text: "I can only imagine how difficult this must be for you right now. Please know that I'm here...",
		category: 'empathy',
		uses: 320
	},
	{
		id: 'p4',
		title: 'Kind Refusal',
		text: 'I value our relationship, but I need to decline this request to protect my own energy...',
		category: 'boundaries',
		uses: 980
	},
	{
		id: 'p5',
		title: 'Everyday Thanks',
		text: 'Thank you for the small things you do that often go unnoticed. They mean the world to me...',
		category: 'gratitude',
		uses: 2100
	}
];

// Legacy exports for compatibility
export const conversationPrompts: Record<PromptCategory, ConversationPrompt[]> = {
	gratitude: [
		{
			id: 'p1',
			text: phrasePrompts[0].text,
			category: 'gratitude',
			situation: 'Deep Appreciation'
		},
		{ id: 'p5', text: phrasePrompts[4].text, category: 'gratitude', situation: 'Everyday Thanks' }
	],
	apologies: [
		{ id: 'p2', text: phrasePrompts[1].text, category: 'apologies', situation: 'Sincere Regret' }
	],
	empathy: [
		{ id: 'p3', text: phrasePrompts[2].text, category: 'empathy', situation: 'Holding Space' }
	],
	boundaries: [
		{ id: 'p4', text: phrasePrompts[3].text, category: 'boundaries', situation: 'Kind Refusal' }
	],
	'self-love': []
};

export const categoryLabels: Record<PromptCategory, string> = {
	gratitude: 'Gratitude',
	apologies: 'Apologies',
	empathy: 'Empathy',
	boundaries: 'Boundaries',
	'self-love': 'Self-Love'
};

export function getAllPrompts(): ConversationPrompt[] {
	return Object.values(conversationPrompts).flat();
}

export function getPromptsByCategory(category: PromptCategory): ConversationPrompt[] {
	return conversationPrompts[category];
}

export function formatUses(uses: number): string {
	if (uses >= 1000) {
		return `${(uses / 1000).toFixed(1)}k uses`;
	}
	return `${uses} uses`;
}
