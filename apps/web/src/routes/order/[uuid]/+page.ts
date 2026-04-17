import type { PageLoad } from './$types';
import { validateSelfOrderLink, type SelfOrderValidation } from '$lib/api/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const validation = await validateSelfOrderLink(params.uuid);
	
	return {
		uuid: params.uuid,
		validation
	};
};
