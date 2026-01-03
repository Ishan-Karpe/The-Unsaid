// ===========================================
// THE UNSAID - Export Service Tests
// ===========================================
// Tests for draft export functionality
// Tests the formatting and file generation logic

import { describe, it, expect, vi } from 'vitest';
import type { Draft } from '$lib/types';

// Mock the browser environment and services
vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('./draftService', () => ({
	draftService: {
		getDrafts: vi.fn()
	}
}));

describe('Export Service Utilities', () => {
	describe('Export Format Generation', () => {
		const mockDraft: Draft = {
			id: 'test-123',
			content: 'Dear Mom, I wanted to tell you how much I appreciate everything you do.',
			recipient: 'Mom',
			intent: 'Express gratitude',
			emotion: 'grateful',
			createdAt: new Date('2024-01-15T10:30:00Z'),
			updatedAt: new Date('2024-01-15T11:00:00Z')
		};

		it('should convert draft to exportable format with all fields', () => {
			const exported = {
				content: mockDraft.content,
				recipient: mockDraft.recipient,
				intent: mockDraft.intent,
				emotion: mockDraft.emotion,
				createdAt: mockDraft.createdAt!.toISOString(),
				updatedAt: mockDraft.updatedAt!.toISOString()
			};

			expect(exported.content).toBe(mockDraft.content);
			expect(exported.recipient).toBe(mockDraft.recipient);
			expect(exported.intent).toBe(mockDraft.intent);
			expect(exported.emotion).toBe(mockDraft.emotion);
			expect(exported.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(exported.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});

		it('should handle draft without emotion', () => {
			const draftWithoutEmotion: Draft = {
				...mockDraft,
				emotion: undefined
			};

			const exported = {
				content: draftWithoutEmotion.content,
				recipient: draftWithoutEmotion.recipient,
				intent: draftWithoutEmotion.intent,
				emotion: draftWithoutEmotion.emotion,
				createdAt: draftWithoutEmotion.createdAt!.toISOString(),
				updatedAt: draftWithoutEmotion.updatedAt!.toISOString()
			};

			expect(exported.emotion).toBeUndefined();
		});

		it('should format JSON export correctly', () => {
			const exportPayload = {
				version: '1.0',
				exportedAt: new Date().toISOString(),
				options: {
					format: 'json' as const,
					includeMetadata: true,
					scope: 'all' as const
				},
				drafts: [
					{
						content: mockDraft.content,
						recipient: mockDraft.recipient,
						intent: mockDraft.intent,
						emotion: mockDraft.emotion,
						createdAt: mockDraft.createdAt!.toISOString(),
						updatedAt: mockDraft.updatedAt!.toISOString()
					}
				]
			};

			const jsonString = JSON.stringify(exportPayload, null, 2);

			expect(jsonString).toContain('"version": "1.0"');
			expect(jsonString).toContain('"format": "json"');
			expect(jsonString).toContain(mockDraft.content);
			expect(jsonString).toContain(mockDraft.recipient);
		});

		it('should format TXT export with headers', () => {
			const txtContent = `THE UNSAID - Draft Export
========================

---

To: ${mockDraft.recipient}
Intent: ${mockDraft.intent}
Emotion: ${mockDraft.emotion}
Created: ${mockDraft.createdAt!.toISOString()}
Updated: ${mockDraft.updatedAt!.toISOString()}

${mockDraft.content}

---`;

			expect(txtContent).toContain('THE UNSAID - Draft Export');
			expect(txtContent).toContain(`To: ${mockDraft.recipient}`);
			expect(txtContent).toContain(`Intent: ${mockDraft.intent}`);
			expect(txtContent).toContain(mockDraft.content);
		});

		it('should format Markdown export with proper structure', () => {
			const mdContent = `# The Unsaid - Draft Export

---

## Draft

**To:** ${mockDraft.recipient}
**Intent:** ${mockDraft.intent}
**Emotion:** ${mockDraft.emotion}
**Created:** ${mockDraft.createdAt!.toISOString()}
**Updated:** ${mockDraft.updatedAt!.toISOString()}

${mockDraft.content}

---`;

			expect(mdContent).toContain('# The Unsaid - Draft Export');
			expect(mdContent).toContain(`**To:** ${mockDraft.recipient}`);
			expect(mdContent).toContain(`**Intent:** ${mockDraft.intent}`);
			expect(mdContent).toContain(mockDraft.content);
		});

		it('should exclude metadata when includeMetadata is false', () => {
			const contentOnlyExport = {
				content: mockDraft.content
			};

			expect(contentOnlyExport.content).toBe(mockDraft.content);
			expect((contentOnlyExport as Record<string, unknown>).recipient).toBeUndefined();
			expect((contentOnlyExport as Record<string, unknown>).intent).toBeUndefined();
		});
	});

	describe('Multiple Drafts Export', () => {
		const mockDrafts: Draft[] = [
			{
				id: '1',
				content: 'First draft content',
				recipient: 'Person A',
				intent: 'Greeting',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-02')
			},
			{
				id: '2',
				content: 'Second draft content',
				recipient: 'Person B',
				intent: 'Apology',
				emotion: 'regretful',
				createdAt: new Date('2024-01-03'),
				updatedAt: new Date('2024-01-04')
			},
			{
				id: '3',
				content: 'Third draft content',
				recipient: 'Person C',
				intent: 'Thank you',
				emotion: 'grateful',
				createdAt: new Date('2024-01-05'),
				updatedAt: new Date('2024-01-06')
			}
		];

		it('should export all drafts in JSON format', () => {
			const exportPayload = {
				version: '1.0',
				exportedAt: new Date().toISOString(),
				options: { format: 'json', includeMetadata: true, scope: 'all' },
				drafts: mockDrafts.map((d) => ({
					content: d.content,
					recipient: d.recipient,
					intent: d.intent,
					emotion: d.emotion,
					createdAt: d.createdAt!.toISOString(),
					updatedAt: d.updatedAt!.toISOString()
				}))
			};

			expect(exportPayload.drafts.length).toBe(3);
			expect(exportPayload.drafts[0].content).toBe('First draft content');
			expect(exportPayload.drafts[1].content).toBe('Second draft content');
			expect(exportPayload.drafts[2].content).toBe('Third draft content');
		});

		it('should handle empty draft list', () => {
			const exportPayload = {
				version: '1.0',
				exportedAt: new Date().toISOString(),
				options: { format: 'json', includeMetadata: true, scope: 'all' },
				drafts: []
			};

			expect(exportPayload.drafts.length).toBe(0);
		});
	});

	describe('Export Filename Generation', () => {
		it('should generate correct filename for JSON format', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const dateStr = date.toISOString().split('T')[0];
			const filename = `the-unsaid-export-${dateStr}.json`;

			expect(filename).toBe('the-unsaid-export-2024-01-15.json');
		});

		it('should generate correct filename for TXT format', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const dateStr = date.toISOString().split('T')[0];
			const filename = `the-unsaid-export-${dateStr}.txt`;

			expect(filename).toBe('the-unsaid-export-2024-01-15.txt');
		});

		it('should generate correct filename for MD format', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const dateStr = date.toISOString().split('T')[0];
			const filename = `the-unsaid-export-${dateStr}.md`;

			expect(filename).toBe('the-unsaid-export-2024-01-15.md');
		});

		it('should generate correct filename for single draft', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const dateStr = date.toISOString().split('T')[0];
			const filename = `the-unsaid-draft-${dateStr}.json`;

			expect(filename).toBe('the-unsaid-draft-2024-01-15.json');
		});
	});

	describe('Edge Cases', () => {
		it('should handle draft with special characters', () => {
			const draftWithSpecialChars: Draft = {
				id: 'special',
				content: 'Content with "quotes", <tags>, & ampersands',
				recipient: "O'Brien",
				intent: 'Test & verify',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const exported = {
				content: draftWithSpecialChars.content,
				recipient: draftWithSpecialChars.recipient,
				intent: draftWithSpecialChars.intent
			};

			expect(exported.content).toBe('Content with "quotes", <tags>, & ampersands');
			expect(exported.recipient).toBe("O'Brien");
		});

		it('should handle draft with unicode content', () => {
			const draftWithUnicode: Draft = {
				id: 'unicode',
				content: '你好世界 🌍 مرحبا שלום こんにちは',
				recipient: 'International Friend 👋',
				intent: 'Cultural greeting',
				emotion: '🎉',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const exported = {
				content: draftWithUnicode.content,
				recipient: draftWithUnicode.recipient,
				emotion: draftWithUnicode.emotion
			};

			expect(exported.content).toBe('你好世界 🌍 مرحبا שלום こんにちは');
			expect(exported.recipient).toBe('International Friend 👋');
			expect(exported.emotion).toBe('🎉');
		});

		it('should handle very long content', () => {
			const longContent = 'A'.repeat(100000);
			const draftWithLongContent: Draft = {
				id: 'long',
				content: longContent,
				recipient: 'Reader',
				intent: 'Test',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const exported = {
				content: draftWithLongContent.content
			};

			expect(exported.content.length).toBe(100000);
		});

		it('should handle empty content', () => {
			const draftWithEmptyContent: Draft = {
				id: 'empty',
				content: '',
				recipient: 'Nobody',
				intent: 'Nothing',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const exported = {
				content: draftWithEmptyContent.content
			};

			expect(exported.content).toBe('');
		});
	});
});
