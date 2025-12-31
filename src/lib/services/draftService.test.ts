// ===========================================
// THE UNSAID - Draft Service Tests
// ===========================================
// Tests for draft CRUD operations with mocked dependencies

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { draftService } from './draftService';
import type { Draft } from '$lib/types';

// Mock supabase
vi.mock('./supabase', () => ({
	supabase: {
		from: vi.fn()
	}
}));

// Mock encryptionService
vi.mock('./encryptionService', () => ({
	encryptionService: {
		isReady: vi.fn(),
		encryptDraft: vi.fn(),
		decryptDraft: vi.fn()
	}
}));

import { supabase } from './supabase';
import { encryptionService } from './encryptionService';

// Type for our mock chain
type MockChain = Record<string, ReturnType<typeof vi.fn>>;

// Mock chain builder helpers
function createMockChain(): MockChain {
	const chain: MockChain = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		eq: vi.fn(),
		is: vi.fn(),
		not: vi.fn(),
		order: vi.fn(),
		range: vi.fn(),
		single: vi.fn()
	};

	// Make each method return the chain for chaining
	Object.values(chain).forEach((mock) => {
		mock.mockReturnValue(chain);
	});

	return chain;
}

// Helper type for new draft (without id)
type NewDraft = Omit<Draft, 'createdAt' | 'updatedAt' | 'id'> & { id?: string | null };

describe('draftService', () => {
	let mockChain: MockChain;

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain = createMockChain();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(supabase.from).mockReturnValue(mockChain as any);
	});

	describe('saveDraft', () => {
		it('should return error when encryption is not ready', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(false);

			const draft: NewDraft = {
				content: 'Test content',
				recipient: 'Mom',
				intent: 'Express love'
			};
			const result = await draftService.saveDraft(draft as Omit<Draft, 'createdAt' | 'updatedAt'>);

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Please log in again to save encrypted drafts');
			expect(encryptionService.encryptDraft).not.toHaveBeenCalled();
		});

		it('should return error when encryption fails', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);
			vi.mocked(encryptionService.encryptDraft).mockResolvedValue({
				encryptedDraft: null,
				error: 'Encryption key not available'
			});

			const draft: NewDraft = {
				content: 'Test content',
				recipient: 'Mom',
				intent: 'Express love'
			};
			const result = await draftService.saveDraft(draft as Omit<Draft, 'createdAt' | 'updatedAt'>);

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Encryption key not available');
		});

		it('should create new draft when no id provided', async () => {
			const mockEncryptedDraft = {
				encrypted_content: 'encrypted-content',
				encrypted_metadata: 'encrypted-metadata',
				iv: 'test-iv'
			};

			vi.mocked(encryptionService.isReady).mockReturnValue(true);
			vi.mocked(encryptionService.encryptDraft).mockResolvedValue({
				encryptedDraft: mockEncryptedDraft,
				error: null
			});

			mockChain.single.mockResolvedValue({
				data: {
					id: 'new-draft-id',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				},
				error: null
			});

			const draft: NewDraft = {
				content: 'Test content',
				recipient: 'Mom',
				intent: 'Express love',
				emotion: 'grateful'
			};
			const result = await draftService.saveDraft(draft as Omit<Draft, 'createdAt' | 'updatedAt'>);

			expect(result.error).toBeNull();
			expect(result.draft).not.toBeNull();
			expect(result.draft?.id).toBe('new-draft-id');
			expect(result.draft?.content).toBe('Test content');
			expect(result.draft?.recipient).toBe('Mom');
			expect(mockChain.insert).toHaveBeenCalledWith({
				encrypted_content: 'encrypted-content',
				encrypted_metadata: 'encrypted-metadata',
				iv: 'test-iv'
			});
		});

		it('should update existing draft when id provided', async () => {
			const mockEncryptedDraft = {
				encrypted_content: 'encrypted-content',
				encrypted_metadata: 'encrypted-metadata',
				iv: 'test-iv'
			};

			vi.mocked(encryptionService.isReady).mockReturnValue(true);
			vi.mocked(encryptionService.encryptDraft).mockResolvedValue({
				encryptedDraft: mockEncryptedDraft,
				error: null
			});

			mockChain.single.mockResolvedValue({
				data: {
					id: 'existing-draft-id',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z'
				},
				error: null
			});

			const result = await draftService.saveDraft({
				id: 'existing-draft-id',
				content: 'Updated content',
				recipient: 'Dad',
				intent: 'Apologize'
			});

			expect(result.error).toBeNull();
			expect(result.draft?.id).toBe('existing-draft-id');
			expect(result.draft?.content).toBe('Updated content');
			expect(mockChain.update).toHaveBeenCalled();
			expect(mockChain.eq).toHaveBeenCalledWith('id', 'existing-draft-id');
		});

		it('should return error on database error', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);
			vi.mocked(encryptionService.encryptDraft).mockResolvedValue({
				encryptedDraft: {
					encrypted_content: 'encrypted',
					encrypted_metadata: 'meta',
					iv: 'iv'
				},
				error: null
			});

			mockChain.single.mockResolvedValue({
				data: null,
				error: { message: 'Database connection failed' }
			});

			const draft: NewDraft = {
				content: 'Test',
				recipient: 'Test',
				intent: 'Test'
			};
			const result = await draftService.saveDraft(draft as Omit<Draft, 'createdAt' | 'updatedAt'>);

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Database connection failed');
		});
	});

	describe('getDrafts', () => {
		it('should return error when encryption is not ready', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(false);

			const result = await draftService.getDrafts();

			expect(result.drafts).toEqual([]);
			expect(result.error).toBe('Please log in again to access your encrypted drafts');
		});

		it('should return decrypted drafts', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.order.mockResolvedValue({
				data: [
					{
						id: 'draft-1',
						encrypted_content: 'enc1',
						encrypted_metadata: 'meta1',
						iv: 'iv1',
						created_at: '2024-01-01T00:00:00Z',
						updated_at: '2024-01-01T00:00:00Z'
					},
					{
						id: 'draft-2',
						encrypted_content: 'enc2',
						encrypted_metadata: 'meta2',
						iv: 'iv2',
						created_at: '2024-01-02T00:00:00Z',
						updated_at: '2024-01-02T00:00:00Z'
					}
				],
				error: null
			});

			vi.mocked(encryptionService.decryptDraft)
				.mockResolvedValueOnce({
					draft: { content: 'Content 1', recipient: 'Mom', intent: 'Love', emotion: 'happy' },
					error: null
				})
				.mockResolvedValueOnce({
					draft: { content: 'Content 2', recipient: 'Dad', intent: 'Thanks', emotion: 'grateful' },
					error: null
				});

			const result = await draftService.getDrafts();

			expect(result.error).toBeNull();
			expect(result.drafts).toHaveLength(2);
			expect(result.drafts[0].content).toBe('Content 1');
			expect(result.drafts[1].content).toBe('Content 2');
		});

		it('should skip corrupted drafts and continue', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.order.mockResolvedValue({
				data: [
					{
						id: 'draft-1',
						encrypted_content: 'enc1',
						encrypted_metadata: 'meta1',
						iv: 'iv1',
						created_at: '2024-01-01T00:00:00Z',
						updated_at: '2024-01-01T00:00:00Z'
					},
					{
						id: 'draft-corrupted',
						encrypted_content: 'corrupted',
						encrypted_metadata: 'corrupted',
						iv: 'iv-bad',
						created_at: '2024-01-02T00:00:00Z',
						updated_at: '2024-01-02T00:00:00Z'
					}
				],
				error: null
			});

			vi.mocked(encryptionService.decryptDraft)
				.mockResolvedValueOnce({
					draft: { content: 'Content 1', recipient: 'Mom', intent: 'Love' },
					error: null
				})
				.mockResolvedValueOnce({
					draft: null,
					error: 'Decryption failed'
				});

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await draftService.getDrafts();

			expect(result.error).toBeNull();
			expect(result.drafts).toHaveLength(1);
			expect(result.drafts[0].id).toBe('draft-1');
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it('should return error on database failure', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.order.mockResolvedValue({
				data: null,
				error: { message: 'Network error' }
			});

			const result = await draftService.getDrafts();

			expect(result.drafts).toEqual([]);
			expect(result.error).toBe('Network error');
		});
	});

	describe('getDraft', () => {
		it('should return error when encryption is not ready', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(false);

			const result = await draftService.getDraft('draft-id');

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Please log in again to access your encrypted drafts');
		});

		it('should return decrypted draft by id', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.single.mockResolvedValue({
				data: {
					id: 'draft-1',
					encrypted_content: 'enc1',
					encrypted_metadata: 'meta1',
					iv: 'iv1',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				},
				error: null
			});

			vi.mocked(encryptionService.decryptDraft).mockResolvedValue({
				draft: { content: 'My content', recipient: 'Sister', intent: 'Share news' },
				error: null
			});

			const result = await draftService.getDraft('draft-1');

			expect(result.error).toBeNull();
			expect(result.draft?.content).toBe('My content');
			expect(result.draft?.recipient).toBe('Sister');
			expect(mockChain.eq).toHaveBeenCalledWith('id', 'draft-1');
		});

		it('should return not found error for missing draft', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.single.mockResolvedValue({
				data: null,
				error: { code: 'PGRST116', message: 'Row not found' }
			});

			const result = await draftService.getDraft('nonexistent-id');

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Draft not found');
		});

		it('should return error on decryption failure', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.single.mockResolvedValue({
				data: {
					id: 'draft-1',
					encrypted_content: 'enc1',
					encrypted_metadata: 'meta1',
					iv: 'iv1',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				},
				error: null
			});

			vi.mocked(encryptionService.decryptDraft).mockResolvedValue({
				draft: null,
				error: 'Invalid key'
			});

			const result = await draftService.getDraft('draft-1');

			expect(result.draft).toBeNull();
			expect(result.error).toBe('Invalid key');
		});
	});

	describe('deleteDraft', () => {
		it('should delete draft permanently', async () => {
			mockChain.eq.mockResolvedValue({
				error: null
			});

			const result = await draftService.deleteDraft('draft-id');

			expect(result.error).toBeNull();
			expect(mockChain.delete).toHaveBeenCalled();
			expect(mockChain.eq).toHaveBeenCalledWith('id', 'draft-id');
		});

		it('should return error on delete failure', async () => {
			mockChain.eq.mockResolvedValue({
				error: { message: 'Delete failed' }
			});

			const result = await draftService.deleteDraft('draft-id');

			expect(result.error).toBe('Delete failed');
		});
	});

	describe('getDraftsPaginated', () => {
		it('should return error when encryption is not ready', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(false);

			const result = await draftService.getDraftsPaginated();

			expect(result.drafts).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.hasMore).toBe(false);
			expect(result.error).toBe('Please log in again to access your encrypted drafts');
		});

		it('should return paginated drafts with metadata', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.range.mockResolvedValue({
				data: [
					{
						id: 'draft-1',
						encrypted_content: 'enc1',
						encrypted_metadata: 'meta1',
						iv: 'iv1',
						created_at: '2024-01-01T00:00:00Z',
						updated_at: '2024-01-01T00:00:00Z'
					}
				],
				count: 5,
				error: null
			});

			vi.mocked(encryptionService.decryptDraft).mockResolvedValue({
				draft: { content: 'Content', recipient: 'Mom', intent: 'Love' },
				error: null
			});

			const result = await draftService.getDraftsPaginated({ limit: 2, offset: 0 });

			expect(result.error).toBeNull();
			expect(result.drafts).toHaveLength(1);
			expect(result.total).toBe(5);
			expect(result.hasMore).toBe(true);
		});

		it('should use default pagination values', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.range.mockResolvedValue({
				data: [],
				count: 0,
				error: null
			});

			await draftService.getDraftsPaginated();

			// Default limit is 20, offset is 0
			expect(mockChain.range).toHaveBeenCalledWith(0, 19);
		});

		it('should correctly calculate hasMore', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.range.mockResolvedValue({
				data: [],
				count: 10,
				error: null
			});

			// offset 0, limit 10 = 0 + 10 < 10 = false (no more)
			const result = await draftService.getDraftsPaginated({ limit: 10, offset: 0 });
			expect(result.hasMore).toBe(false);

			// offset 0, limit 5 = 0 + 5 < 10 = true (more)
			mockChain.range.mockResolvedValue({ data: [], count: 10, error: null });
			const result2 = await draftService.getDraftsPaginated({ limit: 5, offset: 0 });
			expect(result2.hasMore).toBe(true);
		});
	});

	describe('softDeleteDraft', () => {
		it('should set deleted_at timestamp', async () => {
			mockChain.eq.mockResolvedValue({
				error: null
			});

			const result = await draftService.softDeleteDraft('draft-id');

			expect(result.error).toBeNull();
			expect(mockChain.update).toHaveBeenCalled();
			// Check that update was called with a deleted_at value
			const updateCall = mockChain.update.mock.calls[0][0];
			expect(updateCall.deleted_at).toBeDefined();
		});

		it('should return error on failure', async () => {
			mockChain.eq.mockResolvedValue({
				error: { message: 'Update failed' }
			});

			const result = await draftService.softDeleteDraft('draft-id');

			expect(result.error).toBe('Update failed');
		});
	});

	describe('restoreDraft', () => {
		it('should clear deleted_at timestamp', async () => {
			mockChain.eq.mockResolvedValue({
				error: null
			});

			const result = await draftService.restoreDraft('draft-id');

			expect(result.error).toBeNull();
			expect(mockChain.update).toHaveBeenCalledWith({ deleted_at: null });
		});

		it('should return error on failure', async () => {
			mockChain.eq.mockResolvedValue({
				error: { message: 'Restore failed' }
			});

			const result = await draftService.restoreDraft('draft-id');

			expect(result.error).toBe('Restore failed');
		});
	});

	describe('getDeletedDrafts', () => {
		it('should return error when encryption is not ready', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(false);

			const result = await draftService.getDeletedDrafts();

			expect(result.drafts).toEqual([]);
			expect(result.error).toBe('Please log in again to access your encrypted drafts');
		});

		it('should return only deleted drafts', async () => {
			vi.mocked(encryptionService.isReady).mockReturnValue(true);

			mockChain.order.mockResolvedValue({
				data: [
					{
						id: 'deleted-draft-1',
						encrypted_content: 'enc1',
						encrypted_metadata: 'meta1',
						iv: 'iv1',
						created_at: '2024-01-01T00:00:00Z',
						updated_at: '2024-01-01T00:00:00Z',
						deleted_at: '2024-01-03T00:00:00Z'
					}
				],
				error: null
			});

			vi.mocked(encryptionService.decryptDraft).mockResolvedValue({
				draft: { content: 'Deleted content', recipient: 'Mom', intent: 'Test' },
				error: null
			});

			const result = await draftService.getDeletedDrafts();

			expect(result.error).toBeNull();
			expect(result.drafts).toHaveLength(1);
			expect(mockChain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
		});
	});

	describe('permanentlyDeleteDraft', () => {
		it('should delete draft from database', async () => {
			mockChain.eq.mockResolvedValue({
				error: null
			});

			const result = await draftService.permanentlyDeleteDraft('draft-id');

			expect(result.error).toBeNull();
			expect(mockChain.delete).toHaveBeenCalled();
			expect(mockChain.eq).toHaveBeenCalledWith('id', 'draft-id');
		});

		it('should return error on failure', async () => {
			mockChain.eq.mockResolvedValue({
				error: { message: 'Permanent delete failed' }
			});

			const result = await draftService.permanentlyDeleteDraft('draft-id');

			expect(result.error).toBe('Permanent delete failed');
		});
	});
});
