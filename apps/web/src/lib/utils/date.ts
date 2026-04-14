/**
 * Formats a UTC date (from DB) to Jakarta Time (+7)
 */
export function formatToJakarta(date: Date | number | string, options: Intl.DateTimeFormatOptions = {}): string {
	const d = new Date(date);
	return d.toLocaleString('id-ID', {
		timeZone: 'Asia/Jakarta',
		...options
	});
}

/**
 * Returns a relative time string (e.g., "5 menit yang lalu") in Indonesian
 */
export function relativeTime(date: Date | number | string): string {
	const d = new Date(date);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

	if (diffInSeconds < 60) return 'baru saja';
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
	if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
	
	return formatToJakarta(d, { dateStyle: 'medium' });
}
