import type { Order, OrderItem, Product, CartItem } from './types';

export type { Order, OrderItem, Product, CartItem };

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

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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

export async function login(email: string, pin: string): Promise<{ token: string; user: { id: number; name: string; role: string } }> {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, pin })
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Login failed' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Login failed');
	}

	const data = await res.json() as { accessToken: string; user: { id: number; name: string; role: string } };
	setAuthToken(data.accessToken);
	return { token: data.accessToken, user: data.user };
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

export async function getProducts(): Promise<Product[]> {
	const res = await fetchWithAuth('/products');

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to fetch products' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to fetch products');
	}

	return res.json();
}

export async function createOrder(data: {
	customerName: string;
	customerWhatsapp?: string;
	items: { productId: number; quantity: number; unitPriceAtOrder: number }[];
	orderType?: 'POS' | 'Self-Order';
}): Promise<Order & { items: OrderItem[] }> {
	const res = await fetchWithAuth('/orders', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to create order' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to create order');
	}

	return res.json();
}

export async function holdOrder(id: string): Promise<{ message: string }> {
	const res = await fetchWithAuth(`/orders/${id}/hold`, {
		method: 'POST'
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to hold order' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to hold order');
	}

	return res.json();
}

export async function checkoutOrder(id: string): Promise<{ message: string; order: Order }> {
	const idempotencyKey = crypto.randomUUID();
	
	const res = await fetchWithAuth(`/orders/${id}/checkout`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Idempotency-Key': idempotencyKey
		}
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Checkout failed' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Checkout failed');
	}

	return res.json();
}

export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer';

export interface PaymentResult {
	payment: {
		id: number;
		orderId: string;
		method: PaymentMethod;
		amount: number;
		reference?: string;
	};
	paymentStatus: 'Pending' | 'Paid' | 'Partial';
	message: string;
}

export async function recordPayment(data: {
	orderId: string;
	method: PaymentMethod;
	amount: number;
	reference?: string;
}): Promise<PaymentResult> {
	const res = await fetchWithAuth('/payments', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to record payment' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to record payment');
	}

	return res.json();
}

export interface SelfOrderLink {
	uuid: string;
	link: string;
	expiresAt: string;
}

export interface SelfOrderValidation {
	valid: boolean;
	product?: {
		id: number;
		name: string;
		basePrice: number;
		category: string;
	};
	customerName?: string;
	quantity?: number;
	expiresAt?: string;
	reason?: 'expired' | 'used' | 'not_found';
}

export interface SelfOrderSubmitData {
	messageCard?: string;
	senderName?: string;
	deliveryDate?: string;
	customerWhatsapp?: string;
}

export async function generateSelfOrderLink(data: {
	productId: number;
	quantity: number;
	customerName: string;
}): Promise<SelfOrderLink & { id: string; isUsed: boolean }> {
	const res = await fetchWithAuth('/self-order/generate', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to generate link' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to generate link');
	}

	return res.json();
}

export async function validateSelfOrderLink(uuid: string): Promise<SelfOrderValidation> {
	const res = await fetch(`/api/self-order/${uuid}/validate`);

	if (!res.ok) {
		if (res.status === 404) {
			return { valid: false, reason: 'not_found' };
		}
		if (res.status === 403) {
			const data = await res.json() as { reason?: string };
			return { valid: false, reason: (data.reason || 'expired') as 'expired' | 'used' | 'not_found' };
		}
		throw new Error('Failed to validate link');
	}

	return res.json();
}

export async function submitSelfOrder(uuid: string, data: SelfOrderSubmitData): Promise<{
	orderId: string;
	message: string;
	product: { name: string };
}> {
	const res = await fetch(`/api/self-order/${uuid}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to submit order' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to submit order');
	}

	return res.json();
}

export interface SelfOrderLinkItem {
	id: string;
	uuid: string;
	productId: number;
	productName?: string;
	productPrice?: number;
	customerName: string;
	quantity: number;
	expiresAt: Date | string;
	isUsed: boolean;
	createdAt: Date | string;
}

export async function getSelfOrderLinks(): Promise<SelfOrderLinkItem[]> {
	const res = await fetchWithAuth('/self-order/links');
	
	if (!res.ok) {
		const errorData = (await res.json().catch(() => ({ message: 'Failed to fetch links' }))) as {
			message?: string;
		};
		throw new Error(errorData.message || 'Failed to fetch links');
	}
	
	return res.json();
}

export async function deleteSelfOrderLink(id: string): Promise<void> {
	const res = await fetchWithAuth(`/self-order/links/${id}`, {
		method: 'DELETE'
	});
	
	if (!res.ok) {
		throw new Error('Failed to delete link');
	}
}
