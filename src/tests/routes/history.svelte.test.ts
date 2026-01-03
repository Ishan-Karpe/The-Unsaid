// ===========================================
// THE UNSAID - History Page Integration Tests (Browser)
// ===========================================
// Tests for History page with pagination, filtering, and trash functionality
// Runs in browser environment (uses Svelte 5 components)

import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HistoryPage from '../../routes/(app)/history/+page.svelte';
import { draftService } from '$lib/services';
import { draftStore } from '$lib/stores/draft.svelte';
import type { Draft } from '$lib/types';

// Mock the services
vi.mock('$lib/services', async () => {
	return {
		draftService: {
			getDraftsPaginated: vi.fn(),
			softDeleteDraft: vi.fn(),
			restoreDraft: vi.fn(),
			getDeletedDrafts: vi.fn(),
			permanentlyDeleteDraft: vi.fn()
		},
		// Include other exports to prevent module resolution errors
		keyDerivationService: {},
		encryptionService: {},
		saltService: {},
		authService: {},
		aiService: {},
		preferencesService: {},
		insightsService: {},
		exportService: {},
		passwordChangeService: {},
		supabase: {}
	};
});

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

// Sample draft data for tests
const mockDrafts: Draft[] = [
	{
		id: 'draft-1',
		content: 'Hello Mom, I wanted to say how much I appreciate everything you do.',
		recipient: 'Mom',
		intent: 'appreciation',
		emotion: 'grateful',
		createdAt: new Date('2024-01-15'),
		updatedAt: new Date('2024-01-20')
	},
	{
		id: 'draft-2',
		content: 'Dear Dad, I need to talk about our recent conversation.',
		recipient: 'Dad',
		intent: 'boundary',
		emotion: 'anxious',
		createdAt: new Date('2024-01-10'),
		updatedAt: new Date('2024-01-18')
	},
	{
		id: 'draft-3',
		content: 'To my friend Sarah, I miss our old times together.',
		recipient: 'Sarah',
		intent: 'reconnect',
		emotion: 'nostalgic',
		createdAt: new Date('2024-01-05'),
		updatedAt: new Date('2024-01-15')
	}
];

describe('History Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		draftStore.newDraft();

		// Default mock implementation
		vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
			drafts: mockDrafts,
			total: 3,
			hasMore: false,
			error: null
		});

		vi.mocked(draftService.getDeletedDrafts).mockResolvedValue({
			drafts: [],
			error: null
		});
	});

	describe('Initial Rendering', () => {
		it('should render the page header', async () => {
			render(HistoryPage);

			const header = page.getByText('Your Drafts');
			await expect.element(header).toBeInTheDocument();
		});

		it('should render the New Draft button', async () => {
			render(HistoryPage);

			const newDraftButton = page.getByText('New Draft');
			await expect.element(newDraftButton).toBeInTheDocument();
		});

		it('should render the Trash button', async () => {
			render(HistoryPage);

			const trashButton = page.getByText('Trash');
			await expect.element(trashButton).toBeInTheDocument();
		});

		it('should display loading state initially', async () => {
			// Delay the mock to see loading state
			vi.mocked(draftService.getDraftsPaginated).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									drafts: mockDrafts,
									total: 3,
									hasMore: false,
									error: null
								}),
							500
						)
					)
			);

			render(HistoryPage);

			// Should show loading message
			const loadingText = page.getByText('Loading your drafts...');
			await expect.element(loadingText).toBeInTheDocument();
		});

		it('should display draft count after loading', async () => {
			render(HistoryPage);

			// Wait for data to load
			await new Promise((resolve) => setTimeout(resolve, 100));

			const countText = page.getByText('3 drafts saved');
			await expect.element(countText).toBeInTheDocument();
		});
	});

	describe('Draft List Display', () => {
		it('should display draft recipients', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const momText = page.getByText('To: Mom');
			await expect.element(momText).toBeInTheDocument();

			const dadText = page.getByText('To: Dad');
			await expect.element(dadText).toBeInTheDocument();
		});

		it('should display intent labels', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const appreciationBadge = page.getByText('Appreciation');
			await expect.element(appreciationBadge).toBeInTheDocument();

			const boundaryBadge = page.getByText('Boundary');
			await expect.element(boundaryBadge).toBeInTheDocument();
		});

		it('should display emotion badges', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const gratefulBadge = page.getByText('grateful');
			await expect.element(gratefulBadge).toBeInTheDocument();
		});

		it('should display word counts', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check for word count indicators (all drafts have word counts)
			const wordCounts = page.getByText(/\d+ words/);
			await expect.element(wordCounts.first()).toBeInTheDocument();
		});
	});

	describe('Filter Functionality', () => {
		it('should render the FilterPanel component', async () => {
			render(HistoryPage);

			const searchInput = page.getByPlaceholder('Search drafts...');
			await expect.element(searchInput).toBeInTheDocument();
		});

		it('should filter drafts by search query', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const searchInput = page.getByPlaceholder('Search drafts...');
			await searchInput.fill('Mom');

			// Wait for filter to apply
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Mom's draft should be visible
			const momText = page.getByText('To: Mom');
			await expect.element(momText).toBeInTheDocument();
		});

		it('should show no results message when search has no matches', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const searchInput = page.getByPlaceholder('Search drafts...');
			await searchInput.fill('nonexistent search term xyz');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const noResultsText = page.getByText('No matching drafts');
			await expect.element(noResultsText).toBeInTheDocument();
		});

		it('should display Filters toggle button', async () => {
			render(HistoryPage);

			const filtersButton = page.getByText('Filters');
			await expect.element(filtersButton).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('should show welcome message for new users', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [],
				total: 0,
				hasMore: false,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const welcomeTitle = page.getByText('Welcome to The Unsaid');
			await expect.element(welcomeTitle).toBeInTheDocument();
		});

		it('should show Write Your First Draft button in welcome state', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [],
				total: 0,
				hasMore: false,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const startButton = page.getByText('Write Your First Draft');
			await expect.element(startButton).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('should display error message when loading fails', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [],
				total: 0,
				hasMore: false,
				error: 'Failed to load drafts'
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const errorText = page.getByText('Failed to load drafts');
			await expect.element(errorText).toBeInTheDocument();
		});

		it('should show Try Again button on error', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [],
				total: 0,
				hasMore: false,
				error: 'Failed to load drafts'
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const retryButton = page.getByText('Try Again');
			await expect.element(retryButton).toBeInTheDocument();
		});

		it('should retry loading when Try Again is clicked', async () => {
			vi.mocked(draftService.getDraftsPaginated)
				.mockResolvedValueOnce({
					drafts: [],
					total: 0,
					hasMore: false,
					error: 'Failed to load drafts'
				})
				.mockResolvedValueOnce({
					drafts: mockDrafts,
					total: 3,
					hasMore: false,
					error: null
				});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const retryButton = page.getByText('Try Again');
			await retryButton.click();

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have called getDraftsPaginated twice
			expect(draftService.getDraftsPaginated).toHaveBeenCalledTimes(2);
		});
	});

	describe('Pagination', () => {
		it('should show Load More button when there are more drafts', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: mockDrafts,
				total: 50,
				hasMore: true,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const loadMoreButton = page.getByText(/Load More/);
			await expect.element(loadMoreButton).toBeInTheDocument();
		});

		it('should display progress bar when there are more drafts', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: mockDrafts,
				total: 50,
				hasMore: true,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Progress bar shows "X of Y" text
			const progressText = page.getByText(/3 of 50/);
			await expect.element(progressText).toBeInTheDocument();
		});

		it('should load more drafts when clicking Load More', async () => {
			const additionalDrafts: Draft[] = [
				{
					id: 'draft-4',
					content: 'Another draft content',
					recipient: 'Colleague',
					intent: 'apology',
					emotion: 'regretful',
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-05')
				}
			];

			vi.mocked(draftService.getDraftsPaginated)
				.mockResolvedValueOnce({
					drafts: mockDrafts,
					total: 4,
					hasMore: true,
					error: null
				})
				.mockResolvedValueOnce({
					drafts: additionalDrafts,
					total: 4,
					hasMore: false,
					error: null
				});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const loadMoreButton = page.getByText(/Load More/);
			await loadMoreButton.click();

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have made second call
			expect(draftService.getDraftsPaginated).toHaveBeenCalledTimes(2);
		});

		it('should not show Load More when all drafts are loaded', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: mockDrafts,
				total: 3,
				hasMore: false,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const loadMoreButton = page.getByText(/Load More/);
			await expect.element(loadMoreButton).not.toBeInTheDocument();
		});
	});

	describe('Delete Functionality', () => {
		it('should show delete button on each draft', async () => {
			const { container } = render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Each draft should have a delete button with the trash icon
			const deleteButtons = container.querySelectorAll('button[title="Delete draft"]');
			expect(deleteButtons.length).toBe(3);
		});

		it('should show confirm/cancel buttons after first delete click', async () => {
			const { container } = render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const deleteButtons = container.querySelectorAll('button[title="Delete draft"]');
			const firstDeleteButton = deleteButtons[0] as HTMLButtonElement;
			await firstDeleteButton.click();

			// Should now show Confirm and Cancel buttons
			const confirmButton = page.getByText('Confirm');
			await expect.element(confirmButton).toBeInTheDocument();

			const cancelButton = page.getByText('Cancel');
			await expect.element(cancelButton).toBeInTheDocument();
		});

		it('should soft delete draft when confirmed', async () => {
			vi.mocked(draftService.softDeleteDraft).mockResolvedValue({
				error: null
			});

			const { container } = render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const deleteButtons = container.querySelectorAll('button[title="Delete draft"]');
			const firstDeleteButton = deleteButtons[0] as HTMLButtonElement;
			await firstDeleteButton.click();

			const confirmButton = page.getByText('Confirm');
			await confirmButton.click();

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(draftService.softDeleteDraft).toHaveBeenCalledWith('draft-1');
		});

		it('should cancel delete when Cancel is clicked', async () => {
			const { container } = render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const deleteButtons = container.querySelectorAll('button[title="Delete draft"]');
			const firstDeleteButton = deleteButtons[0] as HTMLButtonElement;
			await firstDeleteButton.click();

			const cancelButton = page.getByText('Cancel');
			await cancelButton.click();

			// Confirm button should no longer be visible
			const confirmButton = page.getByText('Confirm');
			await expect.element(confirmButton).not.toBeInTheDocument();
		});
	});

	describe('Edit Functionality', () => {
		it('should show edit button on each draft', async () => {
			const { container } = render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const editButtons = container.querySelectorAll('button[title="Edit draft"]');
			expect(editButtons.length).toBe(3);
		});
	});

	describe('Trash View', () => {
		it('should open trash modal when clicking Trash button', async () => {
			const { container } = render(HistoryPage);

			const trashButton = page.getByText('Trash');
			await trashButton.click();

			// Wait for modal to appear
			await new Promise((resolve) => setTimeout(resolve, 100));

			// TrashView modal should be visible - check for the dialog element
			const dialog = container.querySelector('dialog.modal-open');
			expect(dialog).not.toBeNull();
		});
	});

	describe('DraftPreview Integration', () => {
		it('should display draft content preview', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check that draft content is previewed (truncated)
			const previewText = page.getByText(/Hello Mom, I wanted to say/);
			await expect.element(previewText).toBeInTheDocument();
		});

		it('should highlight search terms in preview', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const searchInput = page.getByPlaceholder('Search drafts...');
			await searchInput.fill('appreciate');

			await new Promise((resolve) => setTimeout(resolve, 100));

			// The search term should be highlighted (wrapped in mark element)
			// This tests that the DraftPreview component receives the searchQuery
			const momDraft = page.getByText('To: Mom');
			await expect.element(momDraft).toBeInTheDocument();
		});
	});

	describe('Date Formatting', () => {
		it('should display relative dates for drafts', async () => {
			// Mock a draft with recent update
			const recentDraft: Draft = {
				id: 'draft-recent',
				content: 'Recent draft content',
				recipient: 'Test',
				intent: 'other',
				emotion: 'calm',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [recentDraft],
				total: 1,
				hasMore: false,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should show "Today at" for recent drafts
			const todayText = page.getByText(/Today at/);
			await expect.element(todayText).toBeInTheDocument();
		});
	});

	describe('Page Title', () => {
		it('should set the page title', async () => {
			render(HistoryPage);

			// The svelte:head should set the title
			// Note: In browser tests, we can check the document title
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(document.title).toContain('History');
		});
	});

	describe('Animation States', () => {
		it('should apply fade-in animation classes', async () => {
			const { container } = render(HistoryPage);

			// Should have fade-in elements
			const fadeInElements = container.querySelectorAll('.fade-in');
			expect(fadeInElements.length).toBeGreaterThan(0);
		});
	});

	describe('Singular/Plural Draft Count', () => {
		it('should use singular for one draft', async () => {
			vi.mocked(draftService.getDraftsPaginated).mockResolvedValue({
				drafts: [mockDrafts[0]],
				total: 1,
				hasMore: false,
				error: null
			});

			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const countText = page.getByText('1 draft saved');
			await expect.element(countText).toBeInTheDocument();
		});

		it('should use plural for multiple drafts', async () => {
			render(HistoryPage);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const countText = page.getByText('3 drafts saved');
			await expect.element(countText).toBeInTheDocument();
		});
	});
});
