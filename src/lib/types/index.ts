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
export interface UserInsights {
	totalDrafts: number;
	draftsThisMonth: number;
	topRecipients: { name: string; count: number }[];
	emotionsExpressed: { emotion: string; count: number }[];
	averageLength: number;
	longestDraft: { id: string; wordCount: number } | null;
}

// ------------------------------------------
// Prompt Types
// ------------------------------------------
export interface ConversationPrompt {
	id: string;
	text: string;
	category: PromptCategory;
	situation: string;
}

export type PromptCategory = 'gratitude' | 'apologies' | 'empathy' | 'boundaries' | 'self-love';

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
