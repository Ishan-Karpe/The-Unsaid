// ===========================================
// THE UNSAID - Root Layout Server Load
// ===========================================
// Provides user data to all routes

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};
