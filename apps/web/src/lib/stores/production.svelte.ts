import { browser } from '$app/environment';
import { getOrders, patchOrder, type Order } from '$lib/api/client';

export type { Order };

export interface KanbanColumn {
	status: Order['status'];
	label: string;
	orders: Order[];
}

export function createProductionStore() {
	let orders = $state<Order[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let lastFetched = $state<Date | null>(null);
	let pollIntervalId: ReturnType<typeof setInterval> | null = null;

	async function fetchActiveOrders(): Promise<void> {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			const result = await getOrders(['Antri', 'Dirangkai', 'Selesai']);
			orders = result;
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			lastFetched = new Date();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch orders';
			console.error('Failed to fetch orders:', e);
		} finally {
			isLoading = false;
		}
	}

	async function updateOrderStatus(id: string, newStatus: Order['status']): Promise<void> {
		const originalOrders = [...orders];
		orders = orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o));

		try {
			const updated = await patchOrder(id, { status: newStatus });
			orders = orders.map((o) => (o.id === id ? { ...o, ...updated } : o));
		} catch (e) {
			orders = originalOrders;
			throw e;
		}
	}

	function startPolling(intervalMs = 30000): void {
		if (!browser) return;

		stopPolling();
		fetchActiveOrders();
		pollIntervalId = setInterval(fetchActiveOrders, intervalMs);
	}

	function stopPolling(): void {
		if (pollIntervalId) {
			clearInterval(pollIntervalId);
			pollIntervalId = null;
		}
	}

	function getOrdersByStatus(status: Order['status']): Order[] {
		return orders.filter((o) => o.status === status);
	}

	return {
		get orders() {
			return orders;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get lastFetched() {
			return lastFetched;
		},
		fetchActiveOrders,
		updateOrderStatus,
		startPolling,
		stopPolling,
		getOrdersByStatus,
		initOrders(initialOrders: Order[]) {
			orders = initialOrders;
		}
	};
}

export const productionStore = createProductionStore();
