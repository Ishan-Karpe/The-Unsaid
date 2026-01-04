// ===========================================
// THE UNSAID - Monitoring Service (Frontend)
// ===========================================
// Lightweight hook for error reporting (Sentry-ready)

export interface MonitoringContext {
	source?: string;
	tags?: Record<string, string>;
	extra?: Record<string, unknown>;
}

interface NormalizedError {
	name: string;
	message: string;
}

function sanitizeMessage(message: string): string {
	return message.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function normalizeError(error: unknown): NormalizedError {
	if (error instanceof Error) {
		return {
			name: error.name || 'Error',
			message: sanitizeMessage(error.message || 'Unexpected error')
		};
	}

	return {
		name: 'Error',
		message: sanitizeMessage(String(error || 'Unexpected error'))
	};
}

export const monitoringService = {
	captureError(error: unknown, context: MonitoringContext = {}) {
		const normalized = normalizeError(error);
		const payload = {
			...normalized,
			...context
		};

		if (import.meta.env.DEV) {
			console.error('[Monitoring] Error captured', payload);
		}

		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('monitoring:error', { detail: payload }));
		}
	}
};
