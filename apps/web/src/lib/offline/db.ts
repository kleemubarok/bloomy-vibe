import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface LocalOrder {
	id: string;
	customerName: string;
	customerWhatsapp: string | null;
	totalAmount: number;
	status: 'Hold' | 'Antri' | 'Dirangkai' | 'Selesai' | 'Serah Terima';
	paymentStatus: 'Pending' | 'Paid' | 'Partial';
	totalHppSnapshot: number | null;
	priceLockedAt: string | null;
	createdAt: string;
	updatedAt: string;
	items: LocalOrderItem[];
}

export interface LocalOrderItem {
	id: string;
	orderId: string;
	productId: number;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface LocalQueueItem {
	id: string;
	operation: 'CREATE' | 'UPDATE' | 'DELETE';
	entityType: 'orders' | 'order_items' | 'payments';
	entityId: string;
	payload: string;
	status: 'pending' | 'syncing' | 'synced' | 'failed';
	error: string | null;
	createdAt: string;
	updatedAt: string;
	attempts: number;
}

interface OfflineDBSchema extends DBSchema {
	orders: {
		key: string;
		value: LocalOrder;
		indexes: { 'by-status': string; 'by-paymentStatus': string };
	};
	order_items: {
		key: string;
		value: LocalOrderItem;
		indexes: { 'by-orderId': string };
	};
	sync_queue: {
		key: string;
		value: LocalQueueItem;
		indexes: { 'by-status': string; 'by-entityType': string };
	};
}

const DB_NAME = 'bloomy-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('IndexedDB is not available on server'));
	}

	if (!dbPromise) {
		dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('orders')) {
					const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
					orderStore.createIndex('by-status', 'status');
					orderStore.createIndex('by-paymentStatus', 'paymentStatus');
				}

				if (!db.objectStoreNames.contains('order_items')) {
					const itemStore = db.createObjectStore('order_items', { keyPath: 'id' });
					itemStore.createIndex('by-orderId', 'orderId');
				}

				if (!db.objectStoreNames.contains('sync_queue')) {
					const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
					queueStore.createIndex('by-status', 'status');
					queueStore.createIndex('by-entityType', 'entityType');
				}
			},
		});
	}

	return dbPromise;
}

export async function saveOrderLocal(order: LocalOrder): Promise<void> {
	const db = await getDB();
	await db.put('orders', order);
}

export async function getOrderLocal(id: string): Promise<LocalOrder | undefined> {
	const db = await getDB();
	return db.get('orders', id);
}

export async function getAllOrdersLocal(): Promise<LocalOrder[]> {
	const db = await getDB();
	return db.getAll('orders');
}

export async function getOrdersByStatusLocal(
	status: string
): Promise<LocalOrder[]> {
	const db = await getDB();
	return db.getAllFromIndex('orders', 'by-status', status);
}

export async function getOrdersByPaymentStatusLocal(
	paymentStatus: string
): Promise<LocalOrder[]> {
	const db = await getDB();
	return db.getAllFromIndex('orders', 'by-paymentStatus', paymentStatus);
}

export async function deleteOrderLocal(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('orders', id);

	const tx = db.transaction('order_items', 'readwrite');
	const items = await tx.store.index('by-orderId').getAllKeys(id);
	for (const itemKey of items) {
		await tx.store.delete(itemKey);
	}
	await tx.done;
}

export async function saveOrderItemLocal(item: LocalOrderItem): Promise<void> {
	const db = await getDB();
	await db.put('order_items', item);
}

export async function getOrderItemsLocal(
	orderId: string
): Promise<LocalOrderItem[]> {
	const db = await getDB();
	return db.getAllFromIndex('order_items', 'by-orderId', orderId);
}

export async function clearAllLocalData(): Promise<void> {
	const db = await getDB();
	const tx = db.transaction(['orders', 'order_items', 'sync_queue'], 'readwrite');
	await tx.objectStore('orders').clear();
	await tx.objectStore('order_items').clear();
	await tx.objectStore('sync_queue').clear();
	await tx.done;
}

export { getDB as getIndexedDB };