// ===========================================
// THE UNSAID - Conversation Prompts Library
// ===========================================
// A curated collection of 30+ prompts organized by relationship type
// to help users find the right words for meaningful conversations.

import type {
	ConversationPrompt,
	RelationshipCategory,
	PromptSituation,
	PromptCategory,
	EmotionCategory
} from '$lib/types';

// ------------------------------------------
// Prompt Data - 30+ Curated Prompts
// ------------------------------------------

export const prompts: ConversationPrompt[] = [
	// ==========================================
	// PARENTS (6 prompts)
	// ==========================================
	{
		id: 'parents-001',
		text: "I've never told you this, but...",
		relationship: 'parents',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'parents-002',
		text: 'I understand now why you...',
		relationship: 'parents',
		situation: 'understanding',
		emotion: 'empathy'
	},
	{
		id: 'parents-003',
		text: "I'm sorry I never said...",
		relationship: 'parents',
		situation: 'apology',
		emotion: 'apologies'
	},
	{
		id: 'parents-004',
		text: "Growing up, I didn't realize how much you sacrificed when...",
		relationship: 'parents',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'parents-005',
		text: 'I want you to know that the way you raised me shaped who I am because...',
		relationship: 'parents',
		situation: 'gratitude',
		emotion: 'gratitude'
	},
	{
		id: 'parents-006',
		text: "There's something I've been wanting to tell you for years...",
		relationship: 'parents',
		situation: 'vulnerability',
		emotion: 'empathy'
	},

	// ==========================================
	// PARTNERS (6 prompts)
	// ==========================================
	{
		id: 'partners-001',
		text: 'I fall in love with you again when...',
		relationship: 'partners',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'partners-002',
		text: "I've been holding back about...",
		relationship: 'partners',
		situation: 'honesty',
		emotion: 'boundaries'
	},
	{
		id: 'partners-003',
		text: 'What I really need from you right now is...',
		relationship: 'partners',
		situation: 'vulnerability',
		emotion: 'boundaries'
	},
	{
		id: 'partners-004',
		text: "I'm afraid to tell you this, but I need to be honest about...",
		relationship: 'partners',
		situation: 'honesty',
		emotion: 'boundaries'
	},
	{
		id: 'partners-005',
		text: 'When we first met, I never imagined...',
		relationship: 'partners',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'partners-006',
		text: 'I want us to work through this together because...',
		relationship: 'partners',
		situation: 'encouragement',
		emotion: 'empathy'
	},

	// ==========================================
	// FRIENDS (6 prompts)
	// ==========================================
	{
		id: 'friends-001',
		text: 'Our friendship means more than I show because...',
		relationship: 'friends',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'friends-002',
		text: 'I miss when we used to...',
		relationship: 'friends',
		situation: 'reconnection',
		emotion: 'empathy'
	},
	{
		id: 'friends-003',
		text: "I've been thinking about our friendship and wanted to say...",
		relationship: 'friends',
		situation: 'appreciation',
		emotion: 'gratitude'
	},
	{
		id: 'friends-004',
		text: "I know we haven't talked in a while, but...",
		relationship: 'friends',
		situation: 'reconnection',
		emotion: 'empathy'
	},
	{
		id: 'friends-005',
		text: "You've always been there for me, and I want you to know...",
		relationship: 'friends',
		situation: 'gratitude',
		emotion: 'gratitude'
	},
	{
		id: 'friends-006',
		text: 'I owe you an apology for...',
		relationship: 'friends',
		situation: 'apology',
		emotion: 'apologies'
	},

	// ==========================================
	// GRIEF (6 prompts)
	// ==========================================
	{
		id: 'grief-001',
		text: 'I wish I had told you...',
		relationship: 'grief',
		situation: 'regret',
		emotion: 'empathy'
	},
	{
		id: 'grief-002',
		text: 'You taught me...',
		relationship: 'grief',
		situation: 'legacy',
		emotion: 'gratitude'
	},
	{
		id: 'grief-003',
		text: 'If I could talk to you one more time, I would say...',
		relationship: 'grief',
		situation: 'regret',
		emotion: 'empathy'
	},
	{
		id: 'grief-004',
		text: 'I carry you with me every day because...',
		relationship: 'grief',
		situation: 'legacy',
		emotion: 'gratitude'
	},
	{
		id: 'grief-005',
		text: 'The hardest part of losing you was...',
		relationship: 'grief',
		situation: 'vulnerability',
		emotion: 'empathy'
	},
	{
		id: 'grief-006',
		text: 'I know you would want me to...',
		relationship: 'grief',
		situation: 'encouragement',
		emotion: 'self-love'
	},

	// ==========================================
	// SELF (6 prompts)
	// ==========================================
	{
		id: 'self-001',
		text: 'I need to forgive myself for...',
		relationship: 'self',
		situation: 'healing',
		emotion: 'self-love'
	},
	{
		id: 'self-002',
		text: "The truth I've been avoiding is...",
		relationship: 'self',
		situation: 'honesty',
		emotion: 'boundaries'
	},
	{
		id: 'self-003',
		text: "I'm proud of myself for...",
		relationship: 'self',
		situation: 'appreciation',
		emotion: 'self-love'
	},
	{
		id: 'self-004',
		text: 'What I really want for my life is...',
		relationship: 'self',
		situation: 'vulnerability',
		emotion: 'self-love'
	},
	{
		id: 'self-005',
		text: 'I give myself permission to...',
		relationship: 'self',
		situation: 'healing',
		emotion: 'boundaries'
	},
	{
		id: 'self-006',
		text: "I've been too hard on myself about...",
		relationship: 'self',
		situation: 'forgiveness',
		emotion: 'self-love'
	}
];

// ------------------------------------------
// Category Labels & Helpers
// ------------------------------------------

export const relationshipLabels: Record<RelationshipCategory, string> = {
	parents: 'Parents',
	partners: 'Partners',
	friends: 'Friends',
	grief: 'Grief & Loss',
	self: 'Self'
};

export const relationshipDescriptions: Record<RelationshipCategory, string> = {
	parents: 'Express gratitude, understanding, or unspoken feelings to your parents',
	partners: 'Deepen intimacy and honesty in your romantic relationships',
	friends: 'Reconnect, appreciate, or mend friendships that matter',
	grief: 'Process loss and honor those who are no longer with us',
	self: 'Practice self-compassion and inner dialogue'
};

export const situationLabels: Record<PromptSituation, string> = {
	appreciation: 'Appreciation',
	understanding: 'Understanding',
	apology: 'Apology',
	honesty: 'Honesty',
	reconnection: 'Reconnection',
	regret: 'Regret',
	legacy: 'Legacy',
	healing: 'Healing',
	gratitude: 'Gratitude',
	vulnerability: 'Vulnerability',
	forgiveness: 'Forgiveness',
	encouragement: 'Encouragement'
};

// ------------------------------------------
// Query Functions
// ------------------------------------------

/**
 * Get all prompts
 */
export function getAllPrompts(): ConversationPrompt[] {
	return prompts;
}

/**
 * Get prompts by relationship category
 */
export function getPromptsByRelationship(relationship: RelationshipCategory): ConversationPrompt[] {
	return prompts.filter((p) => p.relationship === relationship);
}

/**
 * Get prompts by situation
 */
export function getPromptsBySituation(situation: PromptSituation): ConversationPrompt[] {
	return prompts.filter((p) => p.situation === situation);
}

/**
 * Get a specific prompt by ID
 */
export function getPromptById(id: string): ConversationPrompt | undefined {
	return prompts.find((p) => p.id === id);
}

/**
 * Search prompts by keyword
 */
export function searchPrompts(query: string): ConversationPrompt[] {
	const normalizedQuery = query.toLowerCase().trim();
	if (!normalizedQuery) return prompts;

	return prompts.filter(
		(p) =>
			p.text.toLowerCase().includes(normalizedQuery) ||
			p.relationship.toLowerCase().includes(normalizedQuery) ||
			p.situation.toLowerCase().includes(normalizedQuery) ||
			(p.emotion && p.emotion.toLowerCase().includes(normalizedQuery))
	);
}

/**
 * Get unique situations for a relationship category
 */
export function getSituationsForRelationship(
	relationship: RelationshipCategory
): PromptSituation[] {
	const situations = prompts.filter((p) => p.relationship === relationship).map((p) => p.situation);
	return [...new Set(situations)];
}

// ------------------------------------------
// Recently Used Prompts (localStorage)
// ------------------------------------------

const RECENTLY_USED_KEY = 'unsaid-recently-used-prompts';
const MAX_RECENTLY_USED = 5;
const SAVED_PROMPTS_KEY = 'unsaid-saved-prompts';
const MAX_SAVED_PROMPTS = 100;

/**
 * Get recently used prompt IDs from localStorage
 */
export function getRecentlyUsedIds(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(RECENTLY_USED_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

/**
 * Get recently used prompts
 */
export function getRecentlyUsedPrompts(): ConversationPrompt[] {
	const ids = getRecentlyUsedIds();
	return ids.map((id) => getPromptById(id)).filter((p): p is ConversationPrompt => p !== undefined);
}

/**
 * Mark a prompt as recently used
 */
export function markPromptAsUsed(promptId: string): void {
	if (typeof window === 'undefined') return;
	try {
		const ids = getRecentlyUsedIds();
		// Remove if already exists, then add to front
		const filtered = ids.filter((id) => id !== promptId);
		const updated = [promptId, ...filtered].slice(0, MAX_RECENTLY_USED);
		localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
	} catch {
		// Ignore localStorage errors
	}
}

/**
 * Clear recently used prompts
 */
export function clearRecentlyUsed(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(RECENTLY_USED_KEY);
	} catch {
		// Ignore localStorage errors
	}
}

// ------------------------------------------
// Saved Prompts (localStorage)
// ------------------------------------------

/**
 * Get saved prompt IDs from localStorage
 */
export function getSavedPromptIds(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(SAVED_PROMPTS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function setSavedPromptIds(ids: string[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(ids.slice(0, MAX_SAVED_PROMPTS)));
	} catch {
		// Ignore localStorage errors
	}
}

/**
 * Check if a prompt is saved
 */
export function isPromptSaved(promptId: string): boolean {
	return getSavedPromptIds().includes(promptId);
}

/**
 * Save a prompt
 */
export function savePrompt(promptId: string): void {
	const ids = getSavedPromptIds();
	if (ids.includes(promptId)) return;
	setSavedPromptIds([promptId, ...ids]);
}

/**
 * Remove a saved prompt
 */
export function unsavePrompt(promptId: string): void {
	const ids = getSavedPromptIds();
	setSavedPromptIds(ids.filter((id) => id !== promptId));
}

/**
 * Toggle saved status
 * @returns true if saved after toggle
 */
export function toggleSavedPrompt(promptId: string): boolean {
	if (isPromptSaved(promptId)) {
		unsavePrompt(promptId);
		return false;
	}
	savePrompt(promptId);
	return true;
}

/**
 * Get saved prompts
 */
export function getSavedPrompts(): ConversationPrompt[] {
	const ids = getSavedPromptIds();
	return ids.map((id) => getPromptById(id)).filter((p): p is ConversationPrompt => p !== undefined);
}

// ------------------------------------------
// Legacy Exports for Backward Compatibility
// ------------------------------------------

/** Legacy emotion-based category labels */
export const categoryLabels: Record<PromptCategory, string> = {
	gratitude: 'Gratitude',
	apologies: 'Apologies',
	empathy: 'Empathy',
	boundaries: 'Boundaries',
	'self-love': 'Self-Love'
};

/**
 * Legacy format for conversationPrompts
 * Maps emotion categories to prompts (for Write page sidebar compatibility)
 */
export const conversationPrompts: Record<PromptCategory, ConversationPrompt[]> = {
	gratitude: prompts.filter((p) => p.emotion === 'gratitude'),
	apologies: prompts.filter((p) => p.emotion === 'apologies'),
	empathy: prompts.filter((p) => p.emotion === 'empathy'),
	boundaries: prompts.filter((p) => p.emotion === 'boundaries'),
	'self-love': prompts.filter((p) => p.emotion === 'self-love')
};

/**
 * Legacy getPromptsByCategory function for backward compatibility
 */
export function getPromptsByCategory(category: PromptCategory): ConversationPrompt[] {
	return conversationPrompts[category];
}

/** Legacy PhrasePrompt interface for compatibility */
export interface PhrasePrompt {
	id: string;
	title: string;
	text: string;
	category: EmotionCategory;
	uses: number;
}

/** Legacy phrasePrompts array - maps to new prompts for backward compatibility */
export const phrasePrompts: PhrasePrompt[] = prompts.slice(0, 5).map((p) => ({
	id: p.id,
	title: situationLabels[p.situation],
	text: p.text,
	category: p.emotion || 'gratitude',
	uses: Math.floor(Math.random() * 2000) + 300
}));

/** Legacy formatUses helper */
export function formatUses(uses: number): string {
	if (uses >= 1000) {
		return `${(uses / 1000).toFixed(1)}k uses`;
	}
	return `${uses} uses`;
}
