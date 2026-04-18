import { getIndexedDB, type LocalQueueItem } from './db';

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type EntityType = 'orders' | 'order_items' | 'payments';
export type QueueStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface EnqueueParams {
	operation: OperationType;
	entityType: EntityType;
	entityId: string;
	payload: Record<string, unknown>;
}

export async function enqueue(params: EnqueueParams): Promise<string> {
	const db = await getIndexedDB();

	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const queueItem: LocalQueueItem = {
		id,
		operation: params.operation,
		entityType: params.entityType,
		entityId: params.entityId,
		payload: JSON.stringify(params.payload),
		status: 'pending',
		error: null,
		createdAt: now,
		updatedAt: now,
		attempts: 0,
	};

	await db.put('sync_queue', queueItem);
	return id;
}

export async function dequeue(): Promise<LocalQueueItem | undefined> {
	const db = await getIndexedDB();

	const tx = db.transaction('sync_queue', 'readwrite');
	const store = tx.objectStore('sync_queue');

	const cursor = await store.index('by-status').openCursor(IDBKeyRange.only('pending'));

	if (cursor) {
		const item = cursor.value;
		await store.put({ ...item, status: 'syncing', updatedAt: new Date().toISOString() });
		await tx.done;
		return item;
	}

	await tx.done;
	return undefined;
}

export async function getQueue(): Promise<LocalQueueItem[]> {
	const db = await getIndexedDB();
	return db.getAll('sync_queue');
}

export async function getPendingQueue(): Promise<LocalQueueItem[]> {
	const db = await getIndexedDB();
	return db.getAllFromIndex('sync_queue', 'by-status', 'pending');
}

export async function clearQueue(): Promise<void> {
	const db = await getIndexedDB();
	await db.clear('sync_queue');
}

export async function markSynced(ids: string[]): Promise<void> {
	const db = await getIndexedDB();

	const tx = db.transaction('sync_queue', 'readwrite');
	const store = tx.objectStore('sync_queue');

	for (const id of ids) {
		const item = await store.get(id);
		if (item) {
			await store.put({
				...item,
				status: 'synced',
				updatedAt: new Date().toISOString(),
			});
		}
	}

	await tx.done;
}

export async function markFailed(ids: string[], errors: string[]): Promise<void> {
	const db = await getIndexedDB();

	const tx = db.transaction('sync_queue', 'readwrite');
	const store = tx.objectStore('sync_queue');

	for (let i = 0; i < ids.length; i++) {
		const item = await store.get(ids[i]);
		if (item) {
			await store.put({
				...item,
				status: 'failed',
				error: errors[i] || 'Unknown error',
				attempts: item.attempts + 1,
				updatedAt: new Date().toISOString(),
			});
		}
	}

	await tx.done;
}

export async function retryFailed(): Promise<number> {
	const db = await getIndexedDB();

	const tx = db.transaction('sync_queue', 'readwrite');
	const store = tx.objectStore('sync_queue');

	const failedItems = await store.index('by-status').getAll('failed');
	let retried = 0;

	for (const item of failedItems) {
		if (item.attempts < 3) {
			await store.put({
				...item,
				status: 'pending',
				error: null,
				updatedAt: new Date().toISOString(),
			});
			retried++;
		}
	}

	await tx.done;
	return retried;
}

export async function getQueueStats(): Promise<{
	pending: number;
	syncing: number;
	synced: number;
	failed: number;
}> {
	const db = await getIndexedDB();

	const all = await db.getAll('sync_queue');

	return {
		pending: all.filter((i) => i.status === 'pending').length,
		syncing: all.filter((i) => i.status === 'syncing').length,
		synced: all.filter((i) => i.status === 'synced').length,
		failed: all.filter((i) => i.status === 'failed').length,
	};
}