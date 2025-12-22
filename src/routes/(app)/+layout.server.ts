import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// TODO: Check if user is authenticated
	// If not authenticated, redirect to login
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   throw redirect(303, '/login');
	// }

	return {};
};
