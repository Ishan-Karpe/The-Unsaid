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
import { isE2E, readStorage, writeStorage } from './e2eStorage';

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
 * @property {boolean} onboarding_completed - Whether user finished onboarding
 * @property {string} [onboarding_completed_at] - When onboarding was completed
 * @property {string} [onboarding_skipped_at] - When user chose to skip onboarding
 * @property {string} onboarding_version - Version of onboarding flow completed
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
	onboarding_completed: boolean;
	onboarding_completed_at?: string | null;
	onboarding_skipped_at?: string | null;
	onboarding_version: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * Default preferences for new users
 * AI is disabled by default - requires explicit consent
 * Onboarding is not completed by default
 */
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
	ai_enabled: false,
	emotional_analysis: true,
	autosuggestions: true,
	therapeutic_mode: false,
	ai_personality: 'empathetic',
	ai_consent_date: null,
	theme: 'system',
	onboarding_completed: false,
	onboarding_completed_at: null,
	onboarding_skipped_at: null,
	onboarding_version: 'v1'
};

const E2E_PREFERENCES_KEY = 'e2e_preferences';

function readE2EPreferences(): Record<string, UserPreferences> {
	return readStorage<Record<string, UserPreferences>>(E2E_PREFERENCES_KEY, {});
}

function writeE2EPreferences(preferences: Record<string, UserPreferences>): void {
	writeStorage(E2E_PREFERENCES_KEY, preferences);
}

function getOrCreateE2EPreferences(userId: string): UserPreferences {
	const preferences = readE2EPreferences();
	if (!preferences[userId]) {
		preferences[userId] = {
			user_id: userId,
			...DEFAULT_PREFERENCES,
			ai_enabled: true,
			ai_consent_date: new Date().toISOString(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		writeE2EPreferences(preferences);
	}
	return preferences[userId];
}

/**
 * Onboarding status result type
 */
export interface OnboardingStatus {
	needsOnboarding: boolean;
	completed: boolean;
	skipped: boolean;
	version: string;
}

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
			if (isE2E) {
				const preferences = getOrCreateE2EPreferences(userId);
				return { preferences, error: null };
			}

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
			if (isE2E) {
				const preferences: UserPreferences = {
					user_id: userId,
					...DEFAULT_PREFERENCES,
					ai_enabled: true,
					ai_consent_date: new Date().toISOString(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};
				const all = readE2EPreferences();
				all[userId] = preferences;
				writeE2EPreferences(all);
				return { preferences, error: null };
			}

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
			if (isE2E) {
				const all = readE2EPreferences();
				const existing = all[userId] ?? {
					user_id: userId,
					...DEFAULT_PREFERENCES,
					ai_enabled: true,
					ai_consent_date: new Date().toISOString(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};
				const updated: UserPreferences = {
					...existing,
					...updates,
					updated_at: new Date().toISOString()
				};
				all[userId] = updated;
				writeE2EPreferences(all);
				return { preferences: updated, error: null };
			}

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
	},

	// =========================================
	// ONBOARDING HELPERS
	// =========================================

	/**
	 * Get the onboarding status for a user.
	 *
	 * Determines if user needs to see onboarding based on:
	 * - onboarding_completed = false AND
	 * - onboarding_skipped_at = null
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<OnboardingStatus>} The user's onboarding status
	 *
	 * @example
	 * const status = await preferencesService.getOnboardingStatus(userId);
	 * if (status.needsOnboarding) {
	 *   redirect('/onboarding');
	 * }
	 */
	async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
		const { preferences } = await this.getPreferences(userId);

		if (!preferences) {
			// New user - needs onboarding
			return {
				needsOnboarding: true,
				completed: false,
				skipped: false,
				version: 'v1'
			};
		}

		const completed = preferences.onboarding_completed;
		const skipped = preferences.onboarding_skipped_at !== null;
		const needsOnboarding = !completed && !skipped;

		return {
			needsOnboarding,
			completed,
			skipped,
			version: preferences.onboarding_version
		};
	},

	/**
	 * Mark onboarding as completed.
	 *
	 * Called when user finishes all onboarding steps (including first draft).
	 * Records timestamp for tracking.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} Success result
	 *
	 * @example
	 * // After user completes final onboarding step
	 * await preferencesService.completeOnboarding(userId);
	 * goto('/write');
	 */
	async completeOnboarding(userId: string): Promise<PreferencesResult> {
		return this.updatePreferences(userId, {
			onboarding_completed: true,
			onboarding_completed_at: new Date().toISOString()
		});
	},

	/**
	 * Skip onboarding (for power users).
	 *
	 * Records skip timestamp. User won't be redirected to onboarding again.
	 * Can be reset via Settings.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} Success result
	 *
	 * @example
	 * // When user clicks "Skip onboarding"
	 * await preferencesService.skipOnboarding(userId);
	 * goto('/write');
	 */
	async skipOnboarding(userId: string): Promise<PreferencesResult> {
		return this.updatePreferences(userId, {
			onboarding_skipped_at: new Date().toISOString()
		});
	},

	/**
	 * Reset onboarding (allow user to restart from Settings).
	 *
	 * Clears completion and skip timestamps so user sees onboarding again.
	 *
	 * @param {string} userId - The user's unique identifier
	 * @returns {Promise<PreferencesResult>} Success result
	 *
	 * @example
	 * // In Settings when user clicks "Restart onboarding"
	 * await preferencesService.resetOnboarding(userId);
	 * goto('/onboarding');
	 */
	async resetOnboarding(userId: string): Promise<PreferencesResult> {
		return this.updatePreferences(userId, {
			onboarding_completed: false,
			onboarding_completed_at: null,
			onboarding_skipped_at: null
		});
	}
};
