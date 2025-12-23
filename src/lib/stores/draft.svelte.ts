// ===========================================
// THE UNSAID - Draft Store (Svelte 5 Runes)
// ===========================================
import { SvelteDate } from 'svelte/reactivity';
import type { Draft, SyncStatus } from '$lib/types';

// Default empty draft
const emptyDraft: Draft = {
	id: null,
	content: '',
	recipient: '',
	intent: '',
	emotion: undefined,
	createdAt: null,
	updatedAt: null
};

// Reactive state
let currentDraft = $state<Draft>({ ...emptyDraft });
let isDirty = $state<boolean>(false);
let syncStatus = $state<SyncStatus>({ state: 'saved', lastSync: new SvelteDate() });

export const draftStore = {
	get draft() {
		return currentDraft;
	},
	get isDirty() {
		return isDirty;
	},
	get syncStatus() {
		return syncStatus;
	},

	// Update draft content
	setContent(content: string) {
		currentDraft.content = content;
		isDirty = true;
	},

	// Update draft metadata
	setMetadata(metadata: { recipient?: string; intent?: string; emotion?: string }) {
		if (metadata.recipient !== undefined) currentDraft.recipient = metadata.recipient;
		if (metadata.intent !== undefined) currentDraft.intent = metadata.intent;
		if (metadata.emotion !== undefined) currentDraft.emotion = metadata.emotion;
		isDirty = true;
	},

	// Load a draft (from history or new)
	loadDraft(draft: Draft) {
		currentDraft = { ...draft };
		isDirty = false;
	},

	// Mark as saved
	markSaved(id?: string) {
		if (id) currentDraft.id = id;
		currentDraft.updatedAt = new SvelteDate();
		isDirty = false;
		syncStatus = { state: 'saved', lastSync: new SvelteDate() };
	},

	// Set sync status
	setSyncStatus(status: SyncStatus) {
		syncStatus = status;
	},

	// Reset to empty draft
	newDraft() {
		currentDraft = { ...emptyDraft };
		isDirty = false;
		syncStatus = { state: 'saved', lastSync: new SvelteDate() };
	},

	// Get word count
	get wordCount() {
		return currentDraft.content.trim() ? currentDraft.content.trim().split(/\s+/).length : 0;
	}
};
