// ===========================================
// THE UNSAID - Network Status Store (Svelte 5 Runes)
// ===========================================
// Tracks online/offline status and provides network-aware features
// Implements offline detection, reconnection handling, and operation queueing
//
// USAGE:
// - Import { networkStore } to check online status
// - Use networkStore.isOnline to conditionally show offline UI
// - Queue operations with networkStore.queueOperation() for later sync
//
// @module networkStore

import { browser } from '$app/environment';

// ------------------------------------------
// Types
// ------------------------------------------

export interface QueuedOperation {
	id: string;
	type: string;
	payload: unknown;
	createdAt: number;
	retryCount: number;
}

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

// ------------------------------------------
// Reactive State (Module-level)
// ------------------------------------------

let isOnline = $state(browser ? navigator.onLine : true);
let status = $state<NetworkStatus>(browser && !navigator.onLine ? 'offline' : 'online');
let lastOnlineAt = $state<number | null>(browser && navigator.onLine ? Date.now() : null);
let wasOffline = $state(false);
let operationQueue = $state<QueuedOperation[]>([]);

// Listeners for reconnection events
const reconnectListeners: Array<() => void | Promise<void>> = [];

// ------------------------------------------
// Browser Event Handlers
// ------------------------------------------

if (browser) {
	// Handle online event
	window.addEventListener('online', () => {
		const wasOfflineBefore = !isOnline;
		isOnline = true;
		status = 'reconnecting';
		lastOnlineAt = Date.now();

		if (wasOfflineBefore) {
			wasOffline = true;
			// Notify listeners and process queue
			handleReconnection();
		}
	});

	// Handle offline event
	window.addEventListener('offline', () => {
		isOnline = false;
		status = 'offline';
	});

	// Periodic connectivity check (every 30 seconds when offline)
	setInterval(
		() => {
			if (!isOnline && browser) {
				// Try to verify actual connectivity
				checkConnectivity();
			}
		},
		30 * 1000 // 30 seconds
	);
}

/**
 * Check actual network connectivity
 * Uses a lightweight fetch to verify connection
 */
async function checkConnectivity(): Promise<boolean> {
	if (!browser) return true;

	try {
		// Use a small, cacheable resource to check connectivity
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch('/api/health', {
			method: 'HEAD',
			signal: controller.signal,
			cache: 'no-store'
		});

		clearTimeout(timeoutId);

		if (response.ok && !isOnline) {
			// We're actually online now
			isOnline = true;
			status = 'reconnecting';
			lastOnlineAt = Date.now();
			handleReconnection();
		}

		return response.ok;
	} catch {
		// Still offline or request failed
		return false;
	}
}

/**
 * Handle reconnection - notify listeners and process queue
 */
async function handleReconnection() {
	status = 'reconnecting';

	// Notify all registered listeners
	for (const listener of reconnectListeners) {
		try {
			await listener();
		} catch (error) {
			console.error('[NetworkStore] Reconnect listener error:', error);
		}
	}

	// Process queued operations
	await processQueue();

	status = 'online';
}

/**
 * Process queued operations after reconnection
 */
async function processQueue() {
	if (operationQueue.length === 0) return;

	const queue = [...operationQueue];
	const processed: string[] = [];
	const failed: QueuedOperation[] = [];

	for (const operation of queue) {
		try {
			// Emit event for each operation to be processed
			window.dispatchEvent(
				new CustomEvent('network-queue-process', {
					detail: operation
				})
			);
			processed.push(operation.id);
		} catch (error) {
			console.error('[NetworkStore] Failed to process queued operation:', error);
			if (operation.retryCount < 3) {
				failed.push({ ...operation, retryCount: operation.retryCount + 1 });
			}
		}
	}

	// Update queue with failed operations
	operationQueue = failed;
}

// ------------------------------------------
// Network Store Export
// ------------------------------------------

export const networkStore = {
	/**
	 * Check if the browser is online
	 */
	get isOnline() {
		return isOnline;
	},

	/**
	 * Get current network status
	 */
	get status() {
		return status;
	},

	/**
	 * Get timestamp of last online state
	 */
	get lastOnlineAt() {
		return lastOnlineAt;
	},

	/**
	 * Check if we recently came back online
	 */
	get wasRecentlyOffline() {
		return wasOffline;
	},

	/**
	 * Get pending operations count
	 */
	get pendingOperations() {
		return operationQueue.length;
	},

	/**
	 * Get queued operations
	 */
	get queue() {
		return operationQueue;
	},

	/**
	 * Queue an operation for later when offline
	 * @param type - Operation type identifier
	 * @param payload - Operation data
	 * @returns The queued operation ID
	 */
	queueOperation(type: string, payload: unknown): string {
		const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		const operation: QueuedOperation = {
			id,
			type,
			payload,
			createdAt: Date.now(),
			retryCount: 0
		};

		operationQueue = [...operationQueue, operation];
		return id;
	},

	/**
	 * Remove an operation from the queue
	 * @param id - Operation ID to remove
	 */
	removeFromQueue(id: string): void {
		operationQueue = operationQueue.filter((op) => op.id !== id);
	},

	/**
	 * Clear the operation queue
	 */
	clearQueue(): void {
		operationQueue = [];
	},

	/**
	 * Register a callback for reconnection events
	 * @param callback - Function to call when connection is restored
	 * @returns Unsubscribe function
	 */
	onReconnect(callback: () => void | Promise<void>): () => void {
		reconnectListeners.push(callback);
		return () => {
			const index = reconnectListeners.indexOf(callback);
			if (index > -1) {
				reconnectListeners.splice(index, 1);
			}
		};
	},

	/**
	 * Manually trigger connectivity check
	 */
	async checkConnectivity(): Promise<boolean> {
		return checkConnectivity();
	},

	/**
	 * Clear the wasRecentlyOffline flag
	 */
	acknowledgeReconnection(): void {
		wasOffline = false;
	},

	/**
	 * Reset store state (for testing)
	 */
	reset(): void {
		isOnline = browser ? navigator.onLine : true;
		status = browser && !navigator.onLine ? 'offline' : 'online';
		lastOnlineAt = browser && navigator.onLine ? Date.now() : null;
		wasOffline = false;
		operationQueue = [];
	}
};
