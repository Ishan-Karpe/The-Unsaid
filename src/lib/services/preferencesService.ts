// ===========================================
// THE UNSAID - Preferences Service
// ===========================================
// Handles CRUD operations for user preferences
// Manages AI consent and feature toggles
//
// USAGE:
// - Call getPreferences() on Settings page load
// - Call updatePreferences() when user changes toggles
// - Call enableAI() when user first consents to AI features
//
// SECURITY NOTES:
// - RLS policies ensure users can only access their own preferences
// - AI consent is tracked with timestamp for compliance
//
// @module preferencesService
// @see {@link Settings page} for UI integration

import { supabase } from './supabase';

/**
 * AI personality options for response style
 */
export type AIPersonality = 'empathetic' | 'direct' | 'supportive' | 'neutral';

/**
 * User preferences stored in Supabase
 *
 * @interface UserPreferences
 * @property {string} user_id - User's unique identifier
 * @property {boolean} ai_enabled - Master toggle for AI features (consent)
 * @property {boolean} emotional_analysis - Allow AI to analyze tone & sentiment
 * @property {boolean} autosuggestions - Enable phrase suggestions while typing
 * @property {boolean} therapeutic_mode - Focus on processing over polishing
 * @property {AIPersonality} ai_personality - Preferred AI response style
 * @property {string} [ai_consent_date] - When user consented to AI features
 * @property {string} [theme] - UI theme preference
 * @property {string} [created_at] - Record creation timestamp
 * @property {string} [updated_at] - Record last update timestamp
 */
export interface UserPreferences {
	user_id: string;
	ai_enabled: boolean;
	emotional_analysis: boolean;
	autosuggestions: boolean;
	therapeutic_mode: boolean;
	ai_personality: AIPersonality;
	ai_consent_date?: string | null;
	theme?: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * Default preferences for new users
 * AI is disabled by default - requires explicit consent
 */
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
	ai_enabled: false,
	emotional_analysis: true,
	autosuggestions: true,
	therapeutic_mode: false,
	ai_personality: 'empathetic',
	ai_consent_date: null,
	theme: 'system'
};

/**
 * Result type for preference operations
 * Follows the service pattern: never throws, returns { data, error }
 *
 * @interface PreferencesResult
 */
export interface PreferencesResult {
	preferences: UserPreferences | null;
	error: string | null;
}

/**
 * Service for managing user preferences.
 *
 * Handles AI consent, feature toggles, and personalization settings.
 * All methods follow the { data, error } pattern - they never throw.
 *
 * @example
 * // Get user preferences (creates defaults if needed)
 * const { preferences, error } = await preferencesService.getPreferences(userId);
 *
 * if (preferences) {
 *   console.log('AI enabled:', preferences.ai_enabled);
 * }
 *
 * @example
 * // Update a specific preference
 * await preferencesService.updatePreferences(userId, { therapeutic_mode: true });
 *
 * @example
 * // Check AI consent before making AI requests
 * const hasConsent = await preferencesService.isAIEnabled(userId);
 * if (!hasConsent) {
 *   showConsentModal();
 * }
 */
export const preferencesService = {
	/**
	 * Get user preferences (creates default if none exist).
	 *
	 * For existing users, retrieves their stored preferences.
	 * For new users, creates a default preferences row.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} The user's preferences or error
	 *
	 * @example
	 * const { preferences, error } = await preferencesService.getPreferences(userId);
	 * if (preferences) {
	 *   emotionalAnalysis = preferences.emotional_analysis;
	 *   aiPersonality = preferences.ai_personality;
	 * }
	 */
	async getPreferences(userId: string): Promise<PreferencesResult> {
		try {
			const { data, error } = await supabase
				.from('preferences')
				.select('*')
				.eq('user_id', userId)
				.single();

			if (error && error.code === 'PGRST116') {
				// No preferences exist - create defaults
				return this.createDefaultPreferences(userId);
			}

			if (error) {
				return { preferences: null, error: error.message };
			}

			return { preferences: data as UserPreferences, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to get preferences';
			return { preferences: null, error: message };
		}
	},

	/**
	 * Create default preferences for a new user.
	 *
	 * Called automatically by getPreferences when no preferences exist.
	 * AI is disabled by default - user must explicitly consent.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} The created preferences or error
	 *
	 * @example
	 * // Usually called internally by getPreferences
	 * const { preferences, error } = await preferencesService.createDefaultPreferences(userId);
	 */
	async createDefaultPreferences(userId: string): Promise<PreferencesResult> {
		try {
			const { data, error } = await supabase
				.from('preferences')
				.insert({
					user_id: userId,
					...DEFAULT_PREFERENCES
				})
				.select()
				.single();

			if (error) {
				return { preferences: null, error: error.message };
			}

			return { preferences: data as UserPreferences, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create preferences';
			return { preferences: null, error: message };
		}
	},

	/**
	 * Update user preferences.
	 *
	 * Updates only the specified fields, leaving others unchanged.
	 * If no preferences exist, creates with defaults + updates.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @param {Partial} updates - Partial preferences to update
	 * @returns {Promise<PreferencesResult>} The updated preferences or error
	 *
	 * @example
	 * // Enable AI features
	 * await preferencesService.updatePreferences(userId, { ai_enabled: true });
	 *
	 * @example
	 * // Change AI personality
	 * await preferencesService.updatePreferences(userId, { ai_personality: 'direct' });
	 *
	 * @example
	 * // Update multiple preferences at once
	 * await preferencesService.updatePreferences(userId, {
	 *   emotional_analysis: false,
	 *   therapeutic_mode: true
	 * });
	 */
	async updatePreferences(
		userId: string,
		updates: Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>
	): Promise<PreferencesResult> {
		try {
			const { data, error } = await supabase
				.from('preferences')
				.update(updates)
				.eq('user_id', userId)
				.select()
				.single();

			if (error) {
				// If no row exists (shouldn't happen normally), create with updates
				if (error.code === 'PGRST116') {
					const { data: newData, error: createError } = await supabase
						.from('preferences')
						.insert({
							user_id: userId,
							...DEFAULT_PREFERENCES,
							...updates
						})
						.select()
						.single();

					if (createError) {
						return { preferences: null, error: createError.message };
					}
					return { preferences: newData as UserPreferences, error: null };
				}
				return { preferences: null, error: error.message };
			}

			return { preferences: data as UserPreferences, error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update preferences';
			return { preferences: null, error: message };
		}
	},

	/**
	 * Check if user has enabled AI features (consent check).
	 *
	 * Use this before making any AI requests to verify consent.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<boolean>} Whether AI is enabled for this user
	 *
	 * @example
	 * const aiEnabled = await preferencesService.isAIEnabled(userId);
	 * if (!aiEnabled) {
	 *   showConsentPrompt();
	 *   return;
	 * }
	 * // Proceed with AI request
	 */
	async isAIEnabled(userId: string): Promise<boolean> {
		const { preferences } = await this.getPreferences(userId);
		return preferences?.ai_enabled ?? false;
	},

	/**
	 * Enable AI features (user grants consent).
	 *
	 * Records the consent timestamp for compliance tracking.
	 * This is a one-time action when user first enables AI.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} Success result
	 *
	 * @example
	 * // In consent modal after user clicks "Enable AI"
	 * const { error } = await preferencesService.enableAI(userId);
	 * if (!error) {
	 *   closeModal();
	 *   proceedWithAIRequest();
	 * }
	 */
	async enableAI(userId: string): Promise<PreferencesResult> {
		return this.updatePreferences(userId, {
			ai_enabled: true,
			ai_consent_date: new Date().toISOString()
		});
	},

	/**
	 * Disable AI features (user revokes consent).
	 *
	 * User can re-enable at any time from Settings.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} Success result
	 *
	 * @example
	 * // In settings when user toggles AI off
	 * await preferencesService.disableAI(userId);
	 */
	async disableAI(userId: string): Promise<PreferencesResult> {
		return this.updatePreferences(userId, { ai_enabled: false });
	}
};
