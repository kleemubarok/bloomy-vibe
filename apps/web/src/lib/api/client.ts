import type { Order, OrderItem } from './types';

export type { Order, OrderItem };

const API_BASE = '/api';

function getAuthToken(): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	return sessionStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.removeItem('auth_token');
}

export function isAuthenticated(): boolean {
	return !!getAuthToken();
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
	const token = getAuthToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...((options.headers as Record<string, string>) || {})
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = fetch(`${API_BASE}${url}`, {
		...options,
		headers
	});

	return response.then(async (res) => {
		if (res.status === 401) {
			removeAuthToken();
			if (typeof window !== 'undefined') {
				window.location.href = '/login';
			}
			throw new Error('Session expired');
		}
		return res;
	});
}

export async function login(pin: string): Promise<{ token: string; user: { id: number; name: string; role: string } }> {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pin })
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Login failed' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Login failed');
	}

	const data = await res.json() as { token: string; user: { id: number; name: string; role: string } };
	setAuthToken(data.token);
	return { token: data.token, user: data.user };
}

export function logout(): void {
	removeAuthToken();
	if (typeof window !== 'undefined') {
		window.location.href = '/login';
	}
}

export async function getOrders(status?: string[]): Promise<Order[]> {
	const params = status?.length
		? status.map((s) => `status=${encodeURIComponent(s)}`).join('&')
		: '';
	const endpoint = `/orders${params ? `?${params}` : ''}`;

	const res = await fetchWithAuth(endpoint);

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to fetch orders' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to fetch orders');
	}

	return res.json();
}

export async function getOrder(id: string): Promise<Order & { items: OrderItem[] }> {
	const res = await fetchWithAuth(`/orders/${id}`);

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to fetch order' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to fetch order');
	}

	return res.json();
}

export async function patchOrder(id: string, data: Partial<Order>): Promise<Order> {
	const res = await fetchWithAuth(`/orders/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to update order' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to update order');
	}

	return res.json();
}

export function getNextStatus(
	current: Order['status']
): { label: string; status: Order['status'] } | null {
	const transitions: Record<string, { label: string; status: Order['status'] }> = {
		Antri: { label: 'Mulai Rangkai', status: 'Dirangkai' },
		Dirangkai: { label: 'Selesai', status: 'Selesai' },
		Selesai: { label: 'Serah Terima', status: 'Diambil' }
	};

	return transitions[current] || null;
}

export function getStatusColor(status: Order['status']): string {
	const colors: Record<string, string> = {
		Draft: 'bg-gray-100 text-gray-600',
		Antri: 'bg-amber-100 text-amber-700',
		Dirangkai: 'bg-blue-100 text-blue-700',
		Selesai: 'bg-green-100 text-green-700',
		Diambil: 'bg-emerald-100 text-emerald-700',
		Dikirim: 'bg-purple-100 text-purple-700',
		Batal: 'bg-red-100 text-red-600'
	};

	return colors[status] || 'bg-gray-100 text-gray-600';
}
