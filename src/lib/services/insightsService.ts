// ===========================================
// THE UNSAID - Insights Service
// ===========================================
// Client-side analytics computed from decrypted drafts.
// All pattern computation happens in the browser after decryption.
// The server never learns recipient names, emotions, or content-derived patterns.
//
// ARCHITECTURE:
// This service is called by the Patterns page to compute user insights.
// It fetches all drafts via draftService, then aggregates them into
// meaningful analytics in a single O(n) pass.
//
// PRIVACY NOTE:
// This is intentionally more computationally expensive than server-side
// analytics, but aligns with the zero-knowledge encryption model.
//
// @module insightsService
// @see {@link draftService} for data fetching

import { draftService } from './draftService';
import type {
	Draft,
	InsightPeriod,
	InsightSeriesPoint,
	RecipientInsight,
	EmotionInsight,
	UserInsights
} from '$lib/types';

// ------------------------------------------
// Result Types
// ------------------------------------------

/**
 * Result type for insights computation.
 *
 * @interface InsightsResult
 * @property {UserInsights|null} insights - Computed insights, or null on error
 * @property {string|null} error - Error message if computation failed
 */
export interface InsightsResult {
	insights: UserInsights | null;
	error: string | null;
}

// ------------------------------------------
// Helper Functions
// ------------------------------------------

/**
 * Count words in a text string.
 * Handles empty strings and multiple whitespace.
 */
function wordCount(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

/**
 * Get start of day for a date (midnight local time).
 */
function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the effective date for a draft.
 * Prefers createdAt, falls back to updatedAt.
 */
function getDraftDate(draft: Draft): Date | null {
	return draft.createdAt ?? draft.updatedAt ?? null;
}

/**
 * Format a date as ISO date string (yyyy-mm-dd) in local time.
 */
function toISODateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Format a date as month key (yyyy-mm).
 */
function toMonthKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

/**
 * Get short day name for a date.
 */
function getDayLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get short month name for a date.
 */
function getMonthLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Calculate the difference in days between two dates.
 */
function daysBetween(date1: Date, date2: Date): number {
	const oneDay = 24 * 60 * 60 * 1000;
	const d1 = startOfDay(date1);
	const d2 = startOfDay(date2);
	return Math.round(Math.abs(d2.getTime() - d1.getTime()) / oneDay);
}

/**
 * Get the period start date based on period type.
 */
function getPeriodStart(period: InsightPeriod, now: Date): Date | null {
	const start = new Date(now);

	switch (period) {
		case '7days':
			start.setDate(start.getDate() - 6);
			return startOfDay(start);
		case 'month':
			start.setDate(start.getDate() - 29);
			return startOfDay(start);
		case 'all':
			return null; // No filter for all-time
	}
}

/**
 * Check if a date is within the period.
 */
function isInPeriod(date: Date, periodStart: Date | null): boolean {
	if (!periodStart) return true; // 'all' period
	return date >= periodStart;
}

// ------------------------------------------
// Time Bucket Generators
// ------------------------------------------

/**
 * Generate day buckets for 7-day or month periods.
 */
function generateDayBuckets(days: number, now: Date): Map<string, InsightSeriesPoint> {
	const buckets = new Map<string, InsightSeriesPoint>();

	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		const dateKey = toISODateString(startOfDay(date));

		buckets.set(dateKey, {
			date: dateKey,
			label: getDayLabel(date),
			count: 0
		});
	}

	return buckets;
}

/**
 * Generate month buckets for all-time view.
 * Shows last 12 months.
 */
function generateMonthBuckets(now: Date): Map<string, InsightSeriesPoint> {
	const buckets = new Map<string, InsightSeriesPoint>();

	for (let i = 11; i >= 0; i--) {
		const date = new Date(now);
		date.setMonth(date.getMonth() - i);
		const monthKey = toMonthKey(date);

		buckets.set(monthKey, {
			date: monthKey,
			label: getMonthLabel(date),
			count: 0
		});
	}

	return buckets;
}

// ------------------------------------------
// Core Computation
// ------------------------------------------

/**
 * Compute all insights from drafts in a single pass.
 * This is O(n) where n is the number of drafts.
 */
function computeInsights(drafts: Draft[], period: InsightPeriod): UserInsights {
	const now = new Date();
	const periodStart = getPeriodStart(period, now);

	// Get current and last month boundaries for comparison
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

	// Initialize accumulators
	let totalWords = 0;
	let periodWords = 0;
	let periodDrafts = 0;
	let draftsThisMonth = 0;
	let draftsLastMonth = 0;
	let longestDraft: { id: string; wordCount: number } | null = null;

	// Maps for aggregation
	const recipientMap = new Map<string, { count: number; lastDraftAt: Date | null }>();
	const emotionMap = new Map<string, number>();
	const draftDays = new Set<string>(); // For streak calculation

	// Time buckets based on period
	let timeBuckets: Map<string, InsightSeriesPoint>;
	let bucketKeyFn: (date: Date) => string;

	if (period === 'all') {
		timeBuckets = generateMonthBuckets(now);
		bucketKeyFn = toMonthKey;
	} else {
		const days = period === '7days' ? 7 : 30;
		timeBuckets = generateDayBuckets(days, now);
		bucketKeyFn = (date: Date) => toISODateString(startOfDay(date));
	}

	// Single pass through all drafts
	for (const draft of drafts) {
		const draftDate = getDraftDate(draft);
		const words = wordCount(draft.content);

		// All-time totals
		totalWords += words;

		// Track longest draft
		if (draft.id && (!longestDraft || words > longestDraft.wordCount)) {
			longestDraft = { id: draft.id, wordCount: words };
		}

		// Track draft days for streak
		if (draftDate) {
			draftDays.add(toISODateString(startOfDay(draftDate)));
		}

		// Monthly comparison
		if (draftDate) {
			if (draftDate >= currentMonthStart) {
				draftsThisMonth++;
			} else if (draftDate >= lastMonthStart && draftDate <= lastMonthEnd) {
				draftsLastMonth++;
			}
		}

		// Period-filtered stats
		if (draftDate && isInPeriod(draftDate, periodStart)) {
			periodDrafts++;
			periodWords += words;

			// Time bucket
			const bucketKey = bucketKeyFn(draftDate);
			const bucket = timeBuckets.get(bucketKey);
			if (bucket) {
				bucket.count++;
			}
		}

		// Recipient tracking (all drafts, not just period)
		const recipientName = draft.recipient.trim();
		if (recipientName) {
			const existing = recipientMap.get(recipientName);
			if (existing) {
				existing.count++;
				if (draftDate && (!existing.lastDraftAt || draftDate > existing.lastDraftAt)) {
					existing.lastDraftAt = draftDate;
				}
			} else {
				recipientMap.set(recipientName, { count: 1, lastDraftAt: draftDate });
			}
		}

		// Emotion tracking (all drafts, not just period)
		if (draft.emotion) {
			const emotionName = draft.emotion.trim();
			if (emotionName) {
				emotionMap.set(emotionName, (emotionMap.get(emotionName) || 0) + 1);
			}
		}
	}

	// Calculate writing streak (consecutive days from today)
	const writingStreak = calculateStreak(draftDays, now);

	// Convert recipient map to sorted array with days-since calculation
	const topRecipients: RecipientInsight[] = Array.from(recipientMap.entries())
		.map(([name, data]) => ({
			name,
			count: data.count,
			lastDraftAt: data.lastDraftAt,
			daysSinceLastDraft: data.lastDraftAt ? daysBetween(data.lastDraftAt, now) : null
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5); // Top 5 recipients

	// Convert emotion map to sorted array
	const emotionsExpressed: EmotionInsight[] = Array.from(emotionMap.entries())
		.map(([emotion, count]) => ({ emotion, count }))
		.sort((a, b) => b.count - a.count);

	// Convert time buckets to array (maintains insertion order)
	const draftsOverTime: InsightSeriesPoint[] = Array.from(timeBuckets.values());

	// Calculate average length
	const averageLength = periodDrafts > 0 ? Math.round(periodWords / periodDrafts) : 0;

	return {
		period,
		totalDrafts: drafts.length,
		totalWords,
		longestDraft,
		writingStreak,
		periodDrafts,
		periodWords,
		averageLength,
		draftsThisMonth,
		draftsLastMonth,
		draftsOverTime,
		topRecipients,
		emotionsExpressed
	};
}

/**
 * Calculate the current writing streak.
 * Counts consecutive days with drafts, starting from today and going backward.
 */
function calculateStreak(draftDays: Set<string>, now: Date): number {
	let streak = 0;
	const today = startOfDay(now);

	// Start from today and go backward
	const checkDate = new Date(today);

	while (true) {
		const dateKey = toISODateString(checkDate);

		if (draftDays.has(dateKey)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			// If today has no drafts but yesterday did, check if streak starts from yesterday
			if (streak === 0) {
				checkDate.setDate(checkDate.getDate() - 1);
				const yesterdayKey = toISODateString(checkDate);
				if (draftDays.has(yesterdayKey)) {
					// Continue checking from yesterday
					continue;
				}
			}
			break;
		}
	}

	return streak;
}

// ------------------------------------------
// Service Export
// ------------------------------------------

/**
 * Service for computing user insights from encrypted drafts.
 *
 * All computation happens client-side after decryption, ensuring
 * the server never learns about writing patterns or recipients.
 *
 * @example
 * // Load insights for the patterns page
 * const { insights, error } = await insightsService.getInsights('7days');
 *
 * if (insights) {
 *   console.log(`You've written ${insights.totalWords} words total`);
 *   console.log(`Top recipient: ${insights.topRecipients[0]?.name}`);
 * }
 */
export const insightsService = {
	/**
	 * Get insights for a specific time period.
	 *
	 * Fetches all drafts, decrypts them, and computes analytics
	 * in a single pass. This is computationally expensive but
	 * preserves privacy.
	 *
	 * @param {InsightPeriod} period - Time period to analyze
	 * @returns {Promise<InsightsResult>} Insights or error
	 *
	 * @throws Never throws - all errors are returned in the result object
	 */
	async getInsights(period: InsightPeriod): Promise<InsightsResult> {
		const result = await draftService.getDrafts();

		if (result.error) {
			return { insights: null, error: result.error };
		}

		const insights = computeInsights(result.drafts, period);
		return { insights, error: null };
	},

	/**
	 * Get empty insights for display when no data is available.
	 * Useful for initial state and empty state UI.
	 *
	 * @param {InsightPeriod} period - Time period for bucket generation
	 * @returns {UserInsights} Empty insights with proper structure
	 */
	getEmptyInsights(period: InsightPeriod): UserInsights {
		return computeInsights([], period);
	}
};
