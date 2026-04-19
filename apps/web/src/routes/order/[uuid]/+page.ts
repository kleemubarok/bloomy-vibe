import type { PageLoad } from './$types';
import { validateSelfOrderLink, type SelfOrderValidation } from '$lib/api/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/self-order/${params.uuid}/validate`);
	let validation: SelfOrderValidation;

	if (!res.ok) {
		if (res.status === 404) {
			validation = { valid: false, reason: 'not_found' } as SelfOrderValidation;
		} else if (res.status === 403) {
			const data = await res.json() as { reason?: string };
			validation = { valid: false, reason: (data.reason as any) ?? 'expired' } as SelfOrderValidation;
		} else {
			throw error(500, 'Failed to validate self‑order link');
		}
	} else {
		validation = await res.json() as SelfOrderValidation;
	}

	return {
		uuid: params.uuid,
		validation
	};
};
