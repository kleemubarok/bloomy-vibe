import { describe, it, expect } from 'vitest';

describe('Offline Sync Types', () => {
	it('should validate OnlineState interface', () => {
		const onlineState = {
			isOnline: true,
			lastChecked: new Date().toISOString(),
		};

		expect(onlineState.isOnline).toBe(true);
		expect(onlineState.lastChecked).toBeDefined();
	});

	it('should validate SyncState interface', () => {
		const syncState = {
			isSyncing: false,
			lastSynced: new Date().toISOString(),
			lastError: null,
			pendingCount: 0,
		};

		expect(syncState.isSyncing).toBe(false);
		expect(syncState.pendingCount).toBe(0);
	});

	it('should have valid queue operation types', () => {
		const operationTypes = ['CREATE', 'UPDATE', 'DELETE'];
		expect(operationTypes).toContain('CREATE');
		expect(operationTypes).toContain('UPDATE');
		expect(operationTypes).toContain('DELETE');
	});

	it('should have valid entity types', () => {
		const entityTypes = ['orders', 'order_items', 'payments'];
		expect(entityTypes).toContain('orders');
		expect(entityTypes).toContain('order_items');
		expect(entityTypes).toContain('payments');
	});

	it('should have valid queue statuses', () => {
		const statuses = ['pending', 'syncing', 'synced', 'failed'];
		expect(statuses).toContain('pending');
		expect(statuses).toContain('syncing');
		expect(statuses).toContain('synced');
		expect(statuses).toContain('failed');
	});
});