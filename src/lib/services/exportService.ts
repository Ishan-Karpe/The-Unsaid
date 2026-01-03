// ===========================================
// THE UNSAID - Export Service
// ===========================================
// Handles exporting drafts in various formats (JSON, TXT, MD)
// All exports happen client-side after decryption - server never sees plaintext
//
// USAGE:
// - Call exportAllDrafts() from Settings page
// - Call exportSingleDraft() from History page per-draft actions
//
// SECURITY NOTES:
// - Drafts are decrypted client-side before formatting
// - Export files are generated in browser and downloaded directly
// - No plaintext ever sent to server
//
// @module exportService
// @see {@link draftService} for draft retrieval

import { browser } from '$app/environment';
import { draftService } from './draftService';
import { formatDate } from '$lib/utils/helpers';
import type { Draft, ExportFormat, ExportOptions, ExportedDraft } from '$lib/types';

/**
 * Result type for export operations
 */
export interface ExportResult {
	error: string | null;
}

/**
 * JSON export payload structure
 */
export interface ExportPayload {
	version: string;
	exportedAt: string;
	options: ExportOptions;
	drafts: ExportedDraft[];
}

/**
 * Convert a Draft to ExportedDraft format
 */
function toExportedDraft(draft: Draft): ExportedDraft {
	return {
		content: draft.content,
		recipient: draft.recipient,
		intent: draft.intent,
		emotion: draft.emotion,
		createdAt: draft.createdAt?.toISOString() ?? '',
		updatedAt: draft.updatedAt?.toISOString() ?? ''
	};
}

/**
 * Format a single draft as plain text
 *
 * @param draft - The draft to format
 * @param includeMetadata - Whether to include recipient, intent, dates
 * @returns Formatted text string
 */
export function formatDraftTxt(draft: Draft, includeMetadata: boolean): string {
	const lines: string[] = [];

	if (includeMetadata) {
		if (draft.recipient) {
			lines.push(`To: ${draft.recipient}`);
		}
		if (draft.intent) {
			lines.push(`Intent: ${draft.intent}`);
		}
		if (draft.emotion) {
			lines.push(`Emotion: ${draft.emotion}`);
		}
		if (draft.createdAt) {
			lines.push(`Created: ${formatDate(draft.createdAt)}`);
		}
		if (draft.updatedAt) {
			lines.push(`Updated: ${formatDate(draft.updatedAt)}`);
		}
		lines.push('');
		lines.push('---');
		lines.push('');
	}

	lines.push(draft.content);

	return lines.join('\n');
}

/**
 * Format a single draft as Markdown
 *
 * @param draft - The draft to format
 * @param includeMetadata - Whether to include recipient, intent, dates
 * @returns Formatted markdown string
 */
export function formatDraftMd(draft: Draft, includeMetadata: boolean): string {
	const lines: string[] = [];

	// Title with recipient if available
	if (draft.recipient) {
		lines.push(`# To: ${draft.recipient}`);
	} else {
		lines.push('# Draft');
	}
	lines.push('');

	if (includeMetadata) {
		const metaItems: string[] = [];

		if (draft.intent) {
			metaItems.push(`**Intent:** ${draft.intent}`);
		}
		if (draft.emotion) {
			metaItems.push(`**Emotion:** ${draft.emotion}`);
		}
		if (draft.createdAt) {
			metaItems.push(`**Created:** ${formatDate(draft.createdAt)}`);
		}
		if (draft.updatedAt) {
			metaItems.push(`**Updated:** ${formatDate(draft.updatedAt)}`);
		}

		if (metaItems.length > 0) {
			lines.push(metaItems.join(' | '));
			lines.push('');
			lines.push('---');
			lines.push('');
		}
	}

	lines.push(draft.content);

	return lines.join('\n');
}

/**
 * Build the export payload for JSON export
 *
 * @param drafts - Array of drafts to export
 * @param options - Export options
 * @returns Export payload object
 */
export function buildExportPayload(drafts: Draft[], options: ExportOptions): ExportPayload {
	return {
		version: '1.0',
		exportedAt: new Date().toISOString(),
		options,
		drafts: drafts.map(toExportedDraft)
	};
}

/**
 * Trigger file download in browser
 *
 * @param contents - File contents as string
 * @param filename - Name for the downloaded file
 * @param mime - MIME type for the file
 */
export function downloadFile(contents: string, filename: string, mime: string): void {
	if (!browser) return;

	const blob = new Blob([contents], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Generate a timestamped filename
 *
 * @param prefix - Filename prefix
 * @param extension - File extension (without dot)
 * @returns Filename string
 */
function generateFilename(prefix: string, extension: string): string {
	const date = new Date();
	const timestamp = date.toISOString().slice(0, 10); // YYYY-MM-DD
	return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Get MIME type for export format
 */
function getMimeType(format: ExportFormat): string {
	switch (format) {
		case 'json':
			return 'application/json';
		case 'txt':
			return 'text/plain';
		case 'md':
			return 'text/markdown';
	}
}

/**
 * Get file extension for export format
 */
function getExtension(format: ExportFormat): string {
	return format;
}

/**
 * Service for exporting drafts in various formats.
 *
 * All exports happen client-side after decryption - the server
 * never sees plaintext draft content.
 *
 * @example
 * // Export all drafts as JSON with metadata
 * await exportService.exportAllDrafts({
 *   format: 'json',
 *   includeMetadata: true,
 *   scope: 'all'
 * });
 *
 * @example
 * // Export a single draft as Markdown
 * exportService.exportSingleDraft(draft, {
 *   format: 'md',
 *   includeMetadata: true,
 *   scope: 'selected'
 * });
 */
export const exportService = {
	/**
	 * Export all drafts.
	 *
	 * Fetches all drafts from the database, decrypts them client-side,
	 * formats them according to options, and triggers a file download.
	 *
	 * @param options - Export options (format, includeMetadata)
	 * @returns Result with error if export failed
	 *
	 * @example
	 * const { error } = await exportService.exportAllDrafts({
	 *   format: 'json',
	 *   includeMetadata: true,
	 *   scope: 'all'
	 * });
	 *
	 * if (error) {
	 *   toastStore.error('Export failed: ' + error);
	 * } else {
	 *   toastStore.success('Drafts exported successfully');
	 * }
	 */
	async exportAllDrafts(options: ExportOptions): Promise<ExportResult> {
		if (!browser) {
			return { error: 'Export only available in browser' };
		}

		try {
			// Fetch all drafts (decrypted client-side by draftService)
			const { drafts, error } = await draftService.getDrafts();

			if (error) {
				return { error };
			}

			if (drafts.length === 0) {
				return { error: 'No drafts to export' };
			}

			let contents: string;
			const filename = generateFilename('the-unsaid-drafts', getExtension(options.format));
			const mime = getMimeType(options.format);

			switch (options.format) {
				case 'json': {
					const payload = buildExportPayload(drafts, options);
					contents = JSON.stringify(payload, null, 2);
					break;
				}
				case 'txt': {
					const txtDrafts = drafts.map((d) => formatDraftTxt(d, options.includeMetadata));
					contents = txtDrafts.join('\n\n========================================\n\n');
					break;
				}
				case 'md': {
					const mdDrafts = drafts.map((d) => formatDraftMd(d, options.includeMetadata));
					// Add front matter
					const header = `# The Unsaid - Exported Drafts\n\n*Exported on ${formatDate(new Date())}*\n\n---\n\n`;
					contents = header + mdDrafts.join('\n\n---\n\n');
					break;
				}
			}

			downloadFile(contents, filename, mime);
			return { error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Export failed';
			return { error: message };
		}
	},

	/**
	 * Export a single draft.
	 *
	 * Formats the provided draft according to options and triggers
	 * a file download. Synchronous operation (draft already decrypted).
	 *
	 * @param draft - The draft to export
	 * @param options - Export options (format, includeMetadata)
	 * @returns Result with error if export failed
	 *
	 * @example
	 * const { error } = exportService.exportSingleDraft(draft, {
	 *   format: 'txt',
	 *   includeMetadata: true,
	 *   scope: 'selected'
	 * });
	 */
	exportSingleDraft(draft: Draft, options: ExportOptions): ExportResult {
		if (!browser) {
			return { error: 'Export only available in browser' };
		}

		try {
			let contents: string;
			const recipientSlug = draft.recipient
				? draft.recipient.toLowerCase().replace(/\s+/g, '-').slice(0, 20)
				: 'draft';
			const filename = generateFilename(`unsaid-${recipientSlug}`, getExtension(options.format));
			const mime = getMimeType(options.format);

			switch (options.format) {
				case 'json': {
					const payload = buildExportPayload([draft], options);
					contents = JSON.stringify(payload, null, 2);
					break;
				}
				case 'txt': {
					contents = formatDraftTxt(draft, options.includeMetadata);
					break;
				}
				case 'md': {
					contents = formatDraftMd(draft, options.includeMetadata);
					break;
				}
			}

			downloadFile(contents, filename, mime);
			return { error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Export failed';
			return { error: message };
		}
	},

	/**
	 * Trigger print dialog for a draft.
	 *
	 * Creates a printable view of the draft and opens the browser print dialog.
	 * Uses existing print styles from layout.css.
	 *
	 * @param draft - The draft to print
	 */
	printDraft(draft: Draft): void {
		if (!browser) return;

		// Create a printable container
		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			return;
		}

		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Draft - ${draft.recipient || 'The Unsaid'}</title>
	<style>
		body {
			font-family: Georgia, 'Times New Roman', serif;
			max-width: 800px;
			margin: 40px auto;
			padding: 20px;
			line-height: 1.6;
			color: #333;
		}
		.header {
			border-bottom: 1px solid #ccc;
			padding-bottom: 20px;
			margin-bottom: 30px;
		}
		.recipient {
			font-size: 1.5em;
			font-weight: bold;
			margin: 0 0 10px 0;
		}
		.meta {
			color: #666;
			font-size: 0.9em;
		}
		.meta span {
			margin-right: 20px;
		}
		.content {
			font-size: 1.1em;
			white-space: pre-wrap;
		}
		.footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #ccc;
			text-align: center;
			color: #999;
			font-size: 0.8em;
		}
		@media print {
			body { margin: 0; padding: 20px; }
			.footer { display: none; }
		}
	</style>
</head>
<body>
	<div class="header">
		${draft.recipient ? `<h1 class="recipient">To: ${draft.recipient}</h1>` : ''}
		<div class="meta">
			${draft.intent ? `<span>Intent: ${draft.intent}</span>` : ''}
			${draft.emotion ? `<span>Emotion: ${draft.emotion}</span>` : ''}
			${draft.updatedAt ? `<span>Last updated: ${formatDate(draft.updatedAt)}</span>` : ''}
		</div>
	</div>
	<div class="content">${escapeHtml(draft.content)}</div>
	<div class="footer">
		Exported from The Unsaid
	</div>
</body>
</html>`;

		printWindow.document.write(html);
		printWindow.document.close();

		// Wait for content to render then print
		printWindow.onload = () => {
			printWindow.print();
		};
	}
};

/**
 * Escape HTML special characters for safe rendering
 */
function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}
