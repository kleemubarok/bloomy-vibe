/**
 * API-side date helpers
 * Note: Since this runs in Cloudflare Workers, we use standard Intl and Date APIs.
 */

export function toJakartaTime(date: Date | number | string): string {
	return new Date(date).toLocaleString('id-ID', {
		timeZone: 'Asia/Jakarta',
		dateStyle: 'medium',
		timeStyle: 'short'
	});
}

/**
 * Returns current timestamp in milliseconds (UTC)
 */
export function nowUtc(): number {
	return Date.now();
}
