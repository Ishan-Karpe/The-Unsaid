// ===========================================
// THE UNSAID - Conversation Prompts Data
// ===========================================
import type { ConversationPrompt, PromptCategory } from '$lib/types';

export const conversationPrompts: Record<PromptCategory, ConversationPrompt[]> = {
	parents: [
		{ id: 'p1', text: "I've never told you this, but...", category: 'parents', situation: 'appreciation' },
		{ id: 'p2', text: 'I understand now why you...', category: 'parents', situation: 'understanding' },
		{ id: 'p3', text: "I'm sorry I never said...", category: 'parents', situation: 'apology' },
		{ id: 'p4', text: 'When I was younger, I didn\'t realize...', category: 'parents', situation: 'reflection' },
		{ id: 'p5', text: 'The way you raised me taught me...', category: 'parents', situation: 'gratitude' },
		{ id: 'p6', text: 'I wish we could talk more about...', category: 'parents', situation: 'connection' },
	],
	partners: [
		{ id: 'pa1', text: 'I fall in love with you again when...', category: 'partners', situation: 'appreciation' },
		{ id: 'pa2', text: "I've been holding back about...", category: 'partners', situation: 'honesty' },
		{ id: 'pa3', text: 'What I need from you right now is...', category: 'partners', situation: 'needs' },
		{ id: 'pa4', text: 'I never want to take for granted that you...', category: 'partners', situation: 'gratitude' },
		{ id: 'pa5', text: 'The thing I love most about us is...', category: 'partners', situation: 'connection' },
		{ id: 'pa6', text: "I'm scared to tell you that...", category: 'partners', situation: 'vulnerability' },
	],
	friends: [
		{ id: 'f1', text: 'Our friendship means more than I show because...', category: 'friends', situation: 'appreciation' },
		{ id: 'f2', text: 'I miss when we used to...', category: 'friends', situation: 'reconnection' },
		{ id: 'f3', text: "I've been meaning to tell you...", category: 'friends', situation: 'honesty' },
		{ id: 'f4', text: 'You helped me through a time when...', category: 'friends', situation: 'gratitude' },
		{ id: 'f5', text: 'I should have been there when...', category: 'friends', situation: 'apology' },
		{ id: 'f6', text: 'I think about that time we...', category: 'friends', situation: 'nostalgia' },
	],
	grief: [
		{ id: 'g1', text: 'I wish I had told you...', category: 'grief', situation: 'regret' },
		{ id: 'g2', text: 'You taught me...', category: 'grief', situation: 'legacy' },
		{ id: 'g3', text: 'The thing I miss most about you is...', category: 'grief', situation: 'longing' },
		{ id: 'g4', text: 'I carry you with me when...', category: 'grief', situation: 'remembrance' },
		{ id: 'g5', text: 'I hope you knew that...', category: 'grief', situation: 'reassurance' },
		{ id: 'g6', text: 'If I could see you one more time, I would say...', category: 'grief', situation: 'closure' },
	],
	self: [
		{ id: 's1', text: 'I need to forgive myself for...', category: 'self', situation: 'healing' },
		{ id: 's2', text: 'The truth I keep avoiding is...', category: 'self', situation: 'honesty' },
		{ id: 's3', text: "I'm proud of myself for...", category: 'self', situation: 'celebration' },
		{ id: 's4', text: 'What I really want is...', category: 'self', situation: 'clarity' },
		{ id: 's5', text: 'I deserve to...', category: 'self', situation: 'self-worth' },
		{ id: 's6', text: 'The fear I need to face is...', category: 'self', situation: 'courage' },
	],
};

export const categoryLabels: Record<PromptCategory, string> = {
	parents: 'Parents & Family',
	partners: 'Partners & Spouses',
	friends: 'Friends',
	grief: 'Those We\'ve Lost',
	self: 'Yourself',
};

export function getAllPrompts(): ConversationPrompt[] {
	return Object.values(conversationPrompts).flat();
}

export function getPromptsByCategory(category: PromptCategory): ConversationPrompt[] {
	return conversationPrompts[category];
}
