import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const SUPPORTED_MODES = new Set(['clarify', 'alternatives', 'tone', 'expand', 'opening']);

export const POST: RequestHandler = async ({ params, request }) => {
	// This endpoint is only active during E2E testing
	if (env.PUBLIC_E2E !== 'true') {
		return json({ detail: 'Not found' }, { status: 404 });
	}

	if (!SUPPORTED_MODES.has(params.mode)) {
		return json({ detail: 'Unsupported mode' }, { status: 404 });
	}

	const body = await request.json().catch(() => null);
	const draftText = typeof body?.draft_text === 'string' ? body.draft_text.trim() : '';
	const modeLabel = params.mode.replace(/^\w/, (c) => c.toUpperCase());
	const baseText = draftText || 'Sample draft text';

	return json({
		options: [
			{
				text: `${baseText} (${modeLabel} suggestion)`,
				why: ''
			}
		]
	});
};
