// ===========================================
// THE UNSAID - Type Definitions
// ===========================================

// ------------------------------------------
// Encryption Types
// ------------------------------------------
export interface UserSalt {
	user_id: string;
	salt: string; // Base64 encoded
	created_at: string;
}

// ------------------------------------------
// Draft Types
// ------------------------------------------
export interface Draft {
	id: string | null;
	content: string;
	recipient: string;
	intent: string;
	emotion?: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}

export interface DraftMetadata {
	recipient: string;
	intent: string;
	emotion?: string;
}

export interface EncryptedDraft {
	id: string;
	user_id: string;
	encrypted_content: string;
	encrypted_metadata: string;
	iv: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null; // For soft delete
}

// ------------------------------------------
// Auth Types
// ------------------------------------------
export interface User {
	id: string;
	email?: string;
	created_at?: string;
}

export interface AuthState {
	user: User | null;
	loading: boolean;
	error: string | null;
}

// ------------------------------------------
// Preferences Types
// ------------------------------------------
export interface UserPreferences {
	user_id: string;
	theme: 'light' | 'dark' | 'system';
	ai_enabled: boolean;
	ai_consent_date: string | null;
	onboarding_completed: boolean;
	onboarding_completed_at: string | null;
	onboarding_skipped_at: string | null;
	onboarding_version: string;
}

// ------------------------------------------
// AI Types
// ------------------------------------------
export type AIMode = 'clarify' | 'alternatives' | 'tone' | 'expand' | 'opening';

export interface AIRequest {
	draft_text: string;
	recipient: string;
	intent: string;
	mode: AIMode;
}

export interface AIOption {
	text: string;
	why: string;
}

export interface AIResponse {
	options: AIOption[];
	original_valid: boolean;
	mode: AIMode;
}

// ------------------------------------------
// Sync Types
// ------------------------------------------
export type SyncStatus =
	| { state: 'saved'; lastSync: Date }
	| { state: 'saving' }
	| { state: 'offline'; pendingChanges: boolean }
	| { state: 'error'; message: string; retry: () => void };

// ------------------------------------------
// Insights Types
// ------------------------------------------

/** Time period for filtering insights */
export type InsightPeriod = '7days' | 'month' | 'all';

/** A single data point in a time series chart */
export interface InsightSeriesPoint {
	/** ISO date string (yyyy-mm-dd or yyyy-mm for month buckets) */
	date: string;
	/** UI-friendly label (Mon, Tue, Jan, Feb, etc.) */
	label: string;
	/** Number of drafts in this time bucket */
	count: number;
}

/** Recipient-specific insight with recency tracking */
export interface RecipientInsight {
	/** Recipient name */
	name: string;
	/** Total drafts to this recipient */
	count: number;
	/** When the last draft to this recipient was created */
	lastDraftAt: Date | null;
	/** Days since the last draft (null if no drafts) */
	daysSinceLastDraft: number | null;
}

/** Emotion frequency insight */
export interface EmotionInsight {
	/** Emotion name */
	emotion: string;
	/** Number of drafts with this emotion */
	count: number;
}

/** Complete user insights computed client-side from decrypted drafts */
export interface UserInsights {
	/** The time period these insights cover */
	period: InsightPeriod;

	// All-time totals
	/** Total number of drafts (all time) */
	totalDrafts: number;
	/** Total word count across all drafts */
	totalWords: number;
	/** The longest draft by word count */
	longestDraft: { id: string; wordCount: number } | null;
	/** Current writing streak in consecutive days */
	writingStreak: number;

	// Period-filtered totals
	/** Number of drafts in the selected period */
	periodDrafts: number;
	/** Total words in the selected period */
	periodWords: number;
	/** Average word count per draft in the period */
	averageLength: number;

	// Monthly comparison
	/** Drafts created this calendar month */
	draftsThisMonth: number;
	/** Drafts created last calendar month */
	draftsLastMonth: number;

	// Breakdowns
	/** Time series data for drafts-over-time visualization */
	draftsOverTime: InsightSeriesPoint[];
	/** Top recipients sorted by count descending */
	topRecipients: RecipientInsight[];
	/** Emotions expressed sorted by count descending */
	emotionsExpressed: EmotionInsight[];
}

// ------------------------------------------
// Prompt Types
// ------------------------------------------

/** Emotion-based category for filtering by emotional intent (legacy) */
export type EmotionCategory = 'gratitude' | 'apologies' | 'empathy' | 'boundaries' | 'self-love';

/** Relationship-based category for filtering by recipient type */
export type RelationshipCategory = 'parents' | 'partners' | 'friends' | 'grief' | 'self';

/** Situation describes the context/emotion of the prompt */
export type PromptSituation =
	| 'appreciation'
	| 'understanding'
	| 'apology'
	| 'honesty'
	| 'reconnection'
	| 'regret'
	| 'legacy'
	| 'healing'
	| 'gratitude'
	| 'vulnerability'
	| 'forgiveness'
	| 'encouragement';

/** Enhanced prompt structure with relationship categories */
export interface ConversationPrompt {
	id: string;
	text: string;
	relationship: RelationshipCategory;
	situation: PromptSituation;
	emotion?: EmotionCategory; // Optional legacy compatibility
}

/** Legacy alias for backward compatibility */
export type PromptCategory = EmotionCategory;

// ------------------------------------------
// Export Types
// ------------------------------------------
export type ExportFormat = 'json' | 'txt' | 'md';

export interface ExportOptions {
	format: ExportFormat;
	includeMetadata: boolean;
	scope: 'all' | 'selected';
	draftIds?: string[];
}

export interface ExportedDraft {
	content: string;
	recipient: string;
	intent: string;
	emotion?: string;
	createdAt: string;
	updatedAt: string;
}

// ------------------------------------------
// Pagination Types
// ------------------------------------------
export interface PaginationParams {
	limit: number;
	offset: number;
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;
	hasMore: boolean;
	offset: number;
}

// ------------------------------------------
// Date Range Types
// ------------------------------------------
export interface DateRange {
	start: Date | null;
	end: Date | null;
}
