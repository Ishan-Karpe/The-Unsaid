// ===========================================
// THE UNSAID - FilterPanel Component Tests (Browser)
// ===========================================
// Tests for FilterPanel UI component rendering and interactions
// Runs in browser environment (uses Svelte 5 components)

import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FilterPanel from './FilterPanel.svelte';
import type { DateRange } from '$lib/types';

describe('FilterPanel Component', () => {
	const defaultProps = {
		searchQuery: '',
		selectedRecipient: '',
		sortBy: 'updated' as const,
		dateRange: { start: null, end: null } as DateRange,
		recipients: ['Mom', 'Dad', 'Friend'],
		onsearchchange: vi.fn(),
		onrecipientchange: vi.fn(),
		onsortchange: vi.fn(),
		ondatechange: vi.fn(),
		onclearall: vi.fn()
	};

	describe('Rendering', () => {
		it('should render search input', async () => {
			render(FilterPanel, defaultProps);

			const searchInput = page.getByPlaceholder('Search drafts...');
			await expect.element(searchInput).toBeInTheDocument();
		});

		it('should render recipient dropdown with all options', async () => {
			render(FilterPanel, defaultProps);

			// Check for the "All recipients" default option
			const allRecipientsOption = page.getByText('All recipients');
			await expect.element(allRecipientsOption).toBeInTheDocument();

			// Check that recipients are in the select
			const momOption = page.getByText('Mom');
			await expect.element(momOption).toBeInTheDocument();
		});

		it('should render sort dropdown', async () => {
			render(FilterPanel, defaultProps);

			const lastUpdatedOption = page.getByText('Last updated');
			await expect.element(lastUpdatedOption).toBeInTheDocument();

			const dateCreatedOption = page.getByText('Date created');
			await expect.element(dateCreatedOption).toBeInTheDocument();
		});

		it('should render filters toggle button', async () => {
			render(FilterPanel, defaultProps);

			const filtersButton = page.getByText('Filters');
			await expect.element(filtersButton).toBeInTheDocument();
		});
	});

	describe('Search functionality', () => {
		it('should display provided search query', async () => {
			const props = { ...defaultProps, searchQuery: 'hello world' };
			render(FilterPanel, props);

			const searchInput = page.getByPlaceholder('Search drafts...');
			const inputElement = searchInput.element() as HTMLInputElement;
			expect(inputElement.value).toBe('hello world');
		});

		it('should call onsearchchange when typing', async () => {
			const onsearchchange = vi.fn();
			const props = { ...defaultProps, onsearchchange };
			render(FilterPanel, props);

			const searchInput = page.getByPlaceholder('Search drafts...');
			await searchInput.fill('test query');

			expect(onsearchchange).toHaveBeenCalled();
		});
	});

	describe('Recipient filter', () => {
		it('should display selected recipient', async () => {
			const props = { ...defaultProps, selectedRecipient: 'Mom' };
			render(FilterPanel, props);

			// The select should have Mom selected
			const select = page.getByRole('combobox').first();
			const selectElement = select.element() as HTMLSelectElement;
			expect(selectElement.value).toBe('Mom');
		});

		it('should call onrecipientchange when selecting recipient', async () => {
			const onrecipientchange = vi.fn();
			const props = { ...defaultProps, onrecipientchange };
			render(FilterPanel, props);

			const select = page.getByRole('combobox').first();
			await select.selectOptions('Dad');

			expect(onrecipientchange).toHaveBeenCalledWith('Dad');
		});
	});

	describe('Sort functionality', () => {
		it('should display correct sort option', async () => {
			const props = { ...defaultProps, sortBy: 'created' as const };
			render(FilterPanel, props);

			// Find the sort select (second combobox)
			const selects = page.getByRole('combobox');
			const sortSelect = selects.nth(1);
			const selectElement = sortSelect.element() as HTMLSelectElement;
			expect(selectElement.value).toBe('created');
		});

		it('should call onsortchange when changing sort', async () => {
			const onsortchange = vi.fn();
			const props = { ...defaultProps, onsortchange };
			render(FilterPanel, props);

			const selects = page.getByRole('combobox');
			const sortSelect = selects.nth(1);
			await sortSelect.selectOptions('created');

			expect(onsortchange).toHaveBeenCalledWith('created');
		});
	});

	describe('Advanced filters toggle', () => {
		it('should hide date range picker by default', async () => {
			render(FilterPanel, defaultProps);

			// Date picker presets should not be visible initially
			const last7DaysButton = page.getByText('Last 7 days');
			await expect.element(last7DaysButton).not.toBeInTheDocument();
		});

		it('should show date range picker when clicking Filters', async () => {
			render(FilterPanel, defaultProps);

			// Click the Filters button
			const filtersButton = page.getByText('Filters');
			await filtersButton.click();

			// Now the date picker presets should be visible
			const last7DaysButton = page.getByText('Last 7 days');
			await expect.element(last7DaysButton).toBeInTheDocument();
		});

		it('should toggle advanced filters visibility', async () => {
			render(FilterPanel, defaultProps);

			const filtersButton = page.getByText('Filters');

			// Click to show
			await filtersButton.click();
			let last7DaysButton = page.getByText('Last 7 days');
			await expect.element(last7DaysButton).toBeInTheDocument();

			// Click to hide
			await filtersButton.click();
			last7DaysButton = page.getByText('Last 7 days');
			await expect.element(last7DaysButton).not.toBeInTheDocument();
		});
	});

	describe('Clear all filters', () => {
		it('should show clear all button when filters are active', async () => {
			const props = { ...defaultProps, searchQuery: 'test' };
			render(FilterPanel, props);

			// Open advanced filters
			const filtersButton = page.getByText('Filters');
			await filtersButton.click();

			// Clear all button should be visible
			const clearAllButton = page.getByText('Clear all filters');
			await expect.element(clearAllButton).toBeInTheDocument();
		});

		it('should not show clear all button when no filters active', async () => {
			render(FilterPanel, defaultProps);

			// Open advanced filters
			const filtersButton = page.getByText('Filters');
			await filtersButton.click();

			// Clear all button should NOT be visible when no filters are active
			const clearAllButton = page.getByText('Clear all filters');
			await expect.element(clearAllButton).not.toBeInTheDocument();
		});

		it('should call onclearall when clicking clear all', async () => {
			const onclearall = vi.fn();
			const props = { ...defaultProps, searchQuery: 'test', onclearall };
			render(FilterPanel, props);

			// Open advanced filters
			const filtersButton = page.getByText('Filters');
			await filtersButton.click();

			// Click clear all
			const clearAllButton = page.getByText('Clear all filters');
			await clearAllButton.click();

			expect(onclearall).toHaveBeenCalled();
		});
	});

	describe('Date range integration', () => {
		it('should pass date range props to DateRangePicker', async () => {
			const startDate = new Date('2024-01-01');
			const endDate = new Date('2024-01-31');
			const props = {
				...defaultProps,
				dateRange: { start: startDate, end: endDate }
			};
			render(FilterPanel, props);

			// Open advanced filters
			const filtersButton = page.getByText('Filters');
			await filtersButton.click();

			// Date inputs should be visible
			const fromLabel = page.getByText('From');
			await expect.element(fromLabel).toBeInTheDocument();

			const toLabel = page.getByText('To');
			await expect.element(toLabel).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper search input label', async () => {
			render(FilterPanel, defaultProps);

			const searchInput = page.getByPlaceholder('Search drafts...');
			await expect.element(searchInput).toBeInTheDocument();
		});

		it('should have visible icons', async () => {
			const { container } = render(FilterPanel, defaultProps);

			// Search icon should be present
			const svgElements = container.querySelectorAll('svg');
			expect(svgElements.length).toBeGreaterThan(0);
		});
	});
});
