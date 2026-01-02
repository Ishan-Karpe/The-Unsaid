// ===========================================
// THE UNSAID - Insights Service Tests
// ===========================================
// Tests for client-side insights computation
// Uses vi.setSystemTime() to stabilize date-dependent calculations

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { insightsService } from './insightsService';
import type { Draft } from '$lib/types';

// Mock draftService
vi.mock('./draftService', () => ({
	draftService: {
		getDrafts: vi.fn()
	}
}));

import { draftService } from './draftService';

// ------------------------------------------
// Test Helpers
// ------------------------------------------

function createMockDraft(overrides: Partial<Draft> = {}): Draft {
	return {
		id: 'draft-1',
		content: 'Hello world',
		recipient: 'Mom',
		intent: 'Express love',
		emotion: 'grateful',
		createdAt: new Date('2024-06-15T10:00:00Z'),
		updatedAt: new Date('2024-06-15T10:00:00Z'),
		...overrides
	};
}

function createDraftsForStreak(baseDate: Date, daysBack: number[]): Draft[] {
	return daysBack.map((days, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - days);
		return createMockDraft({
			id: `streak-draft-${index}`,
			createdAt: date,
			updatedAt: date
		});
	});
}

describe('insightsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Set a fixed system time: June 15, 2024
		vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('getInsights', () => {
		it('should return error when draftService fails', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: 'Database connection failed'
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights).toBeNull();
			expect(result.error).toBe('Database connection failed');
		});

		it('should return empty insights when no drafts exist', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.error).toBeNull();
			expect(result.insights).not.toBeNull();
			expect(result.insights?.totalDrafts).toBe(0);
			expect(result.insights?.totalWords).toBe(0);
			expect(result.insights?.periodDrafts).toBe(0);
			expect(result.insights?.writingStreak).toBe(0);
			expect(result.insights?.longestDraft).toBeNull();
			expect(result.insights?.topRecipients).toEqual([]);
			expect(result.insights?.emotionsExpressed).toEqual([]);
		});

		it('should not crash with null dates', async () => {
			const draftWithNullDates = createMockDraft({
				createdAt: null,
				updatedAt: null
			});

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draftWithNullDates],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.error).toBeNull();
			expect(result.insights?.totalDrafts).toBe(1);
			// Words are still counted even without dates
			expect(result.insights?.totalWords).toBe(2); // "Hello world"
		});
	});

	describe('word count', () => {
		it('should correctly count words in a single draft', async () => {
			const draft = createMockDraft({
				content: 'This is a test with exactly eight words here'
			});

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalWords).toBe(9);
		});

		it('should handle empty content', async () => {
			const draft = createMockDraft({ content: '' });

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalWords).toBe(0);
		});

		it('should handle whitespace-only content', async () => {
			const draft = createMockDraft({ content: '   \n\t  ' });

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalWords).toBe(0);
		});

		it('should handle multiple whitespace between words', async () => {
			const draft = createMockDraft({ content: 'word1   word2\t\tword3\n\nword4' });

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalWords).toBe(4);
		});

		it('should track the longest draft', async () => {
			const shortDraft = createMockDraft({
				id: 'short',
				content: 'Short'
			});
			const longDraft = createMockDraft({
				id: 'long',
				content: 'This is the longest draft with many more words than the other one'
			});
			const mediumDraft = createMockDraft({
				id: 'medium',
				content: 'Medium length draft here'
			});

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [shortDraft, longDraft, mediumDraft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.longestDraft).not.toBeNull();
			expect(result.insights?.longestDraft?.id).toBe('long');
			expect(result.insights?.longestDraft?.wordCount).toBe(13);
		});
	});

	describe('recipient analysis', () => {
		it('should identify top recipient', async () => {
			const drafts = [
				createMockDraft({ id: '1', recipient: 'Mom' }),
				createMockDraft({ id: '2', recipient: 'Mom' }),
				createMockDraft({ id: '3', recipient: 'Dad' }),
				createMockDraft({ id: '4', recipient: 'Mom' })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.topRecipients).toHaveLength(2);
			expect(result.insights?.topRecipients[0].name).toBe('Mom');
			expect(result.insights?.topRecipients[0].count).toBe(3);
			expect(result.insights?.topRecipients[1].name).toBe('Dad');
			expect(result.insights?.topRecipients[1].count).toBe(1);
		});

		it('should calculate days since last draft correctly', async () => {
			// Current time is June 15, 2024
			const drafts = [
				createMockDraft({
					id: '1',
					recipient: 'Mom',
					createdAt: new Date('2024-06-10T10:00:00Z') // 5 days ago
				}),
				createMockDraft({
					id: '2',
					recipient: 'Mom',
					createdAt: new Date('2024-06-05T10:00:00Z') // 10 days ago
				})
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			const momInsight = result.insights?.topRecipients.find((r) => r.name === 'Mom');
			expect(momInsight?.daysSinceLastDraft).toBe(5);
		});

		it('should limit top recipients to 5', async () => {
			const recipients = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
			const drafts = recipients.map((name, i) =>
				createMockDraft({ id: `draft-${i}`, recipient: name })
			);

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.topRecipients).toHaveLength(5);
		});

		it('should handle empty recipient names', async () => {
			const drafts = [
				createMockDraft({ id: '1', recipient: '' }),
				createMockDraft({ id: '2', recipient: 'Mom' }),
				createMockDraft({ id: '3', recipient: '   ' }) // Whitespace only
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// Empty recipients should not appear in the list
			expect(result.insights?.topRecipients).toHaveLength(1);
			expect(result.insights?.topRecipients[0].name).toBe('Mom');
		});
	});

	describe('emotion analysis', () => {
		it('should track emotion frequency', async () => {
			const drafts = [
				createMockDraft({ id: '1', emotion: 'grateful' }),
				createMockDraft({ id: '2', emotion: 'grateful' }),
				createMockDraft({ id: '3', emotion: 'sorry' }),
				createMockDraft({ id: '4', emotion: 'grateful' }),
				createMockDraft({ id: '5', emotion: 'hopeful' })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.emotionsExpressed).toHaveLength(3);
			expect(result.insights?.emotionsExpressed[0].emotion).toBe('grateful');
			expect(result.insights?.emotionsExpressed[0].count).toBe(3);
		});

		it('should handle undefined emotions', async () => {
			const drafts = [
				createMockDraft({ id: '1', emotion: undefined }),
				createMockDraft({ id: '2', emotion: 'happy' }),
				createMockDraft({ id: '3', emotion: '' }) // Empty string
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// Only "happy" should appear
			expect(result.insights?.emotionsExpressed).toHaveLength(1);
			expect(result.insights?.emotionsExpressed[0].emotion).toBe('happy');
		});
	});

	describe('writing streak', () => {
		it('should calculate streak from today', async () => {
			// June 15, 14, 13, 12 = 4 consecutive days
			const drafts = createDraftsForStreak(new Date('2024-06-15'), [0, 1, 2, 3]);

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.writingStreak).toBe(4);
		});

		it('should calculate streak from yesterday if no draft today', async () => {
			// June 14, 13, 12 = 3 consecutive days starting from yesterday
			// The key is that streak should start from yesterday when today has no drafts
			// Using explicit dates to avoid timezone issues
			const june14 = new Date('2024-06-14T12:00:00.000Z');
			const june13 = new Date('2024-06-13T12:00:00.000Z');
			const june12 = new Date('2024-06-12T12:00:00.000Z');

			const drafts = [
				createMockDraft({ id: '1', createdAt: june14, updatedAt: june14 }),
				createMockDraft({ id: '2', createdAt: june13, updatedAt: june13 }),
				createMockDraft({ id: '3', createdAt: june12, updatedAt: june12 })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// Streak should be 3 (June 14, 13, 12)
			expect(result.insights?.writingStreak).toBe(3);
		});

		it('should return 0 when no recent drafts', async () => {
			// Draft from a week ago only
			const drafts = createDraftsForStreak(new Date('2024-06-15'), [7]);

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.writingStreak).toBe(0);
		});

		it('should break streak on gap', async () => {
			// Today (0), yesterday (1), gap at day 2, then day 3
			const drafts = createDraftsForStreak(new Date('2024-06-15'), [0, 1, 3]);

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.writingStreak).toBe(2);
		});

		it('should count multiple drafts on same day as one streak day', async () => {
			const baseDate = new Date('2024-06-15T10:00:00Z');
			const drafts = [
				createMockDraft({ id: '1', createdAt: baseDate }),
				createMockDraft({ id: '2', createdAt: new Date('2024-06-15T14:00:00Z') }),
				createMockDraft({ id: '3', createdAt: new Date('2024-06-14T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.writingStreak).toBe(2);
		});
	});

	describe('period filtering', () => {
		it('should filter to last 7 days for 7days period', async () => {
			const drafts = [
				// Within period (June 9-15)
				createMockDraft({ id: '1', createdAt: new Date('2024-06-15T10:00:00Z') }),
				createMockDraft({ id: '2', createdAt: new Date('2024-06-10T10:00:00Z') }),
				// Outside period
				createMockDraft({ id: '3', createdAt: new Date('2024-06-01T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalDrafts).toBe(3);
			expect(result.insights?.periodDrafts).toBe(2);
		});

		it('should filter to last 30 days for month period', async () => {
			const drafts = [
				// Within period
				createMockDraft({ id: '1', createdAt: new Date('2024-06-15T10:00:00Z') }),
				createMockDraft({ id: '2', createdAt: new Date('2024-05-20T10:00:00Z') }),
				// Outside period
				createMockDraft({ id: '3', createdAt: new Date('2024-05-01T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('month');

			expect(result.insights?.totalDrafts).toBe(3);
			expect(result.insights?.periodDrafts).toBe(2);
		});

		it('should include all drafts for all period', async () => {
			const drafts = [
				createMockDraft({ id: '1', createdAt: new Date('2024-06-15T10:00:00Z') }),
				createMockDraft({ id: '2', createdAt: new Date('2024-01-01T10:00:00Z') }),
				createMockDraft({ id: '3', createdAt: new Date('2023-06-01T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('all');

			expect(result.insights?.totalDrafts).toBe(3);
			expect(result.insights?.periodDrafts).toBe(3);
		});
	});

	describe('monthly comparison', () => {
		it('should count drafts this month and last month', async () => {
			// June 2024 = this month, May 2024 = last month
			const drafts = [
				// This month (June)
				createMockDraft({ id: '1', createdAt: new Date('2024-06-15T10:00:00Z') }),
				createMockDraft({ id: '2', createdAt: new Date('2024-06-01T10:00:00Z') }),
				// Last month (May)
				createMockDraft({ id: '3', createdAt: new Date('2024-05-20T10:00:00Z') }),
				createMockDraft({ id: '4', createdAt: new Date('2024-05-15T10:00:00Z') }),
				createMockDraft({ id: '5', createdAt: new Date('2024-05-01T10:00:00Z') }),
				// Two months ago (April) - shouldn't count
				createMockDraft({ id: '6', createdAt: new Date('2024-04-15T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.draftsThisMonth).toBe(2);
			expect(result.insights?.draftsLastMonth).toBe(3);
		});
	});

	describe('drafts over time', () => {
		it('should generate 7 buckets for 7days period', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.draftsOverTime).toHaveLength(7);
		});

		it('should generate 30 buckets for month period', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('month');

			expect(result.insights?.draftsOverTime).toHaveLength(30);
		});

		it('should generate 12 buckets for all period', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('all');

			expect(result.insights?.draftsOverTime).toHaveLength(12);
		});

		it('should correctly bucket drafts by day', async () => {
			const drafts = [
				createMockDraft({ id: '1', createdAt: new Date('2024-06-15T10:00:00Z') }),
				createMockDraft({ id: '2', createdAt: new Date('2024-06-15T14:00:00Z') }),
				createMockDraft({ id: '3', createdAt: new Date('2024-06-14T10:00:00Z') })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// Find today's bucket (June 15)
			const todayBucket = result.insights?.draftsOverTime.find((b) => b.date === '2024-06-15');
			expect(todayBucket?.count).toBe(2);

			// Find yesterday's bucket (June 14)
			const yesterdayBucket = result.insights?.draftsOverTime.find((b) => b.date === '2024-06-14');
			expect(yesterdayBucket?.count).toBe(1);
		});

		it('should have correct day labels', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// June 15, 2024 is a Saturday
			const todayBucket = result.insights?.draftsOverTime[6]; // Last bucket is today
			expect(todayBucket?.label).toBe('Sat');
		});

		it('should have correct month labels for all period', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('all');

			// Last bucket should be June
			const lastBucket = result.insights?.draftsOverTime[11];
			expect(lastBucket?.label).toBe('Jun');
		});
	});

	describe('average length', () => {
		it('should calculate average word count per draft', async () => {
			const drafts = [
				createMockDraft({ id: '1', content: 'Two words' }),
				createMockDraft({ id: '2', content: 'This has four words' }),
				createMockDraft({ id: '3', content: 'Six words are in this sentence' })
			];

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// (2 + 4 + 6) / 3 = 4
			expect(result.insights?.averageLength).toBe(4);
		});

		it('should return 0 for no drafts', async () => {
			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.averageLength).toBe(0);
		});
	});

	describe('getEmptyInsights', () => {
		it('should return properly structured empty insights', () => {
			const empty = insightsService.getEmptyInsights('7days');

			expect(empty.period).toBe('7days');
			expect(empty.totalDrafts).toBe(0);
			expect(empty.totalWords).toBe(0);
			expect(empty.writingStreak).toBe(0);
			expect(empty.periodDrafts).toBe(0);
			expect(empty.averageLength).toBe(0);
			expect(empty.longestDraft).toBeNull();
			expect(empty.topRecipients).toEqual([]);
			expect(empty.emotionsExpressed).toEqual([]);
			expect(empty.draftsOverTime).toHaveLength(7);
		});

		it('should generate correct buckets for each period', () => {
			const sevenDays = insightsService.getEmptyInsights('7days');
			expect(sevenDays.draftsOverTime).toHaveLength(7);

			const month = insightsService.getEmptyInsights('month');
			expect(month.draftsOverTime).toHaveLength(30);

			const all = insightsService.getEmptyInsights('all');
			expect(all.draftsOverTime).toHaveLength(12);
		});
	});

	describe('edge cases', () => {
		it('should handle draft with only updatedAt date', async () => {
			const draft = createMockDraft({
				createdAt: null,
				updatedAt: new Date('2024-06-15T10:00:00Z')
			});

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			// Should still be counted in period
			expect(result.insights?.periodDrafts).toBe(1);
		});

		it('should handle large number of drafts', async () => {
			const drafts: Draft[] = [];
			for (let i = 0; i < 1000; i++) {
				drafts.push(
					createMockDraft({
						id: `draft-${i}`,
						recipient: `Recipient ${i % 10}`,
						emotion: `emotion${i % 5}`,
						content: `Content for draft number ${i}`
					})
				);
			}

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts,
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalDrafts).toBe(1000);
			expect(result.insights?.topRecipients).toHaveLength(5); // Capped at 5
		});

		it('should handle unicode content', async () => {
			const draft = createMockDraft({
				content: '你好 世界 🌍 emoji test'
			});

			vi.mocked(draftService.getDrafts).mockResolvedValue({
				drafts: [draft],
				error: null
			});

			const result = await insightsService.getInsights('7days');

			expect(result.insights?.totalWords).toBe(5);
		});
	});
});
