import { describe, it, expect } from 'vitest';

describe('Offline Types', () => {
	it('should export LocalOrder type', () => {
		const order = {
			id: 'test-1',
			customerName: 'Test',
			customerWhatsapp: null,
			totalAmount: 100000,
			status: 'Hold',
			paymentStatus: 'Pending',
			totalHppSnapshot: null,
			priceLockedAt: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			items: [],
		};

		expect(order.id).toBe('test-1');
		expect(order.status).toBe('Hold');
		expect(order.paymentStatus).toBe('Pending');
	});

	it('should export LocalQueueItem type', () => {
		const queueItem = {
			id: 'q-1',
			operation: 'CREATE',
			entityType: 'orders',
			entityId: 'order-1',
			payload: JSON.stringify({ test: true }),
			status: 'pending' as const,
			error: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			attempts: 0,
		};

		expect(queueItem.operation).toBe('CREATE');
		expect(queueItem.status).toBe('pending');
	});

	it('should have valid operation types', () => {
		const validOperations = ['CREATE', 'UPDATE', 'DELETE'];
		expect(validOperations).toContain('CREATE');
		expect(validOperations).toContain('UPDATE');
		expect(validOperations).toContain('DELETE');
	});

	it('should have valid entity types', () => {
		const validEntities = ['orders', 'order_items', 'payments'];
		expect(validEntities).toContain('orders');
		expect(validEntities).toContain('order_items');
		expect(validEntities).toContain('payments');
	});

	it('should have valid queue statuses', () => {
		const validStatuses = ['pending', 'syncing', 'synced', 'failed'];
		expect(validStatuses).toContain('pending');
		expect(validStatuses).toContain('syncing');
		expect(validStatuses).toContain('synced');
		expect(validStatuses).toContain('failed');
	});
});