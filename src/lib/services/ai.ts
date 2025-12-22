// ===========================================
// THE UNSAID - AI Service (Frontend Client)
// ===========================================
import { PUBLIC_API_URL } from '$env/static/public';
import type { AIMode, AIRequest, AIResponse } from '$lib/types';

const AI_ENDPOINTS: Record<AIMode, string> = {
	clarify: '/api/ai/clarify',
	alternatives: '/api/ai/alternatives',
	tone: '/api/ai/tone',
	expand: '/api/ai/expand',
	opening: '/api/ai/opening'
};

export const aiService = {
	/**
	 * Get AI assistance for a draft
	 */
	async getAssistance(
		request: AIRequest,
		authToken: string
	): Promise<{ data: AIResponse | null; error: string | null }> {
		const endpoint = AI_ENDPOINTS[request.mode];

		try {
			const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`
				},
				body: JSON.stringify({
					draft_text: request.draft_text,
					recipient: request.recipient,
					intent: request.intent
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: errorData.detail || `Request failed with status ${response.status}`
				};
			}

			const data = await response.json();
			return {
				data: {
					options: data.options,
					original_valid: true,
					mode: request.mode
				},
				error: null
			};
		} catch (err) {
			return {
				data: null,
				error: err instanceof Error ? err.message : 'Failed to connect to AI service'
			};
		}
	},

	/**
	 * Check if AI service is available
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
};
