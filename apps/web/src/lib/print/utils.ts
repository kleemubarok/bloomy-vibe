export function formatCurrency(value: number | undefined | null): string {
	const num = typeof value === 'number' && !isNaN(value) ? value : 0;
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(num);
}

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

export function formatTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString('id-ID', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDateTime(date: Date | string): string {
	return `${formatDate(date)} ${formatTime(date)}`;
}

export function triggerPrint(): void {
	if (typeof window !== 'undefined') {
		window.print();
	}
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
}
