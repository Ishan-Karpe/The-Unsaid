// ===========================================
// THE UNSAID - Root Layout Server Load
// ===========================================
// Provides session data to all routes

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals.session
	};
};
