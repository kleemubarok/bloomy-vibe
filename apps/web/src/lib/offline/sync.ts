import { writable } from 'svelte/store';
import { getQueue, markSynced, markFailed, type LocalQueueItem } from './queue';
import { isOnline } from './online';
import { fetchWithAuth } from '$lib/api/client';

export interface SyncState {
	isSyncing: boolean;
	lastSynced: string | null;
	lastError: string | null;
	pendingCount: number;
}

const initialState: SyncState = {
	isSyncing: false,
	lastSynced: null,
	lastError: null,
	pendingCount: 0,
};

function createSyncStore() {
	const { subscribe, set, update } = writable<SyncState>(initialState);

	let syncInterval: ReturnType<typeof setInterval> | null = null;
	const SYNC_INTERVAL_MS = 30000;

	async function triggerSync(): Promise<{ synced: number; failed: number }> {
		if (!isOnline()) {
			update((s) => ({ ...s, lastError: 'Offline' }));
			return { synced: 0, failed: 0 };
		}

		update((s) => ({ ...s, isSyncing: true, lastError: null }));

		try {
			const queue = await getQueue();
			const pendingItems = queue.filter((i) => i.status === 'pending');

			if (pendingItems.length === 0) {
				update((s) => ({
					...s,
					isSyncing: false,
					lastSynced: new Date().toISOString(),
					pendingCount: 0,
				}));
				return { synced: 0, failed: 0 };
			}

			const operations = pendingItems.map((item) => ({
				id: item.id,
				entityType: item.entityType,
				entityId: item.entityId,
				operation: item.operation,
				payload: JSON.parse(item.payload),
				timestamp: new Date(item.createdAt).getTime(),
			}));

			const response = await fetchWithAuth('/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ operations }),
			});

			if (!response.ok) {
				throw new Error(`Sync failed: ${response.status}`);
			}

			const result = await response.json() as {
				synced: Array<{ id: string }>;
				failed: Array<{ id: string; error: string }>;
			};

			const syncedIds = result.synced?.map((s) => s.id) || [];
			const failedOps = result.failed || [];

			if (syncedIds.length > 0) {
				await markSynced(syncedIds);
			}

			if (failedOps.length > 0) {
				const failedIds = failedOps.map((f) => f.id);
				const errors = failedOps.map((f) => f.error);
				await markFailed(failedIds, errors);
			}

			const remainingQueue = await getQueue();
			const newPendingCount = remainingQueue.filter((i) => i.status === 'pending').length;

			update((s) => ({
				...s,
				isSyncing: false,
				lastSynced: new Date().toISOString(),
				lastError: failedOps.length > 0 ? `${failedOps.length} failed` : null,
				pendingCount: newPendingCount,
			}));

			return { synced: syncedIds.length, failed: failedOps.length };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			update((s) => ({
				...s,
				isSyncing: false,
				lastError: errorMessage,
			}));
			return { synced: 0, failed: 0 };
		}
	}

	async function manualSync(): Promise<void> {
		await triggerSync();
	}

	async function autoSync(): Promise<void> {
		if (!isOnline()) return;
		await triggerSync();
	}

	function startAutoSync() {
		if (syncInterval) return;
		syncInterval = setInterval(autoSync, SYNC_INTERVAL_MS);
	}

	function stopAutoSync() {
		if (syncInterval) {
			clearInterval(syncInterval);
			syncInterval = null;
		}
	}

	async function updatePendingCount() {
		const queue = await getQueue();
		const count = queue.filter((i) => i.status === 'pending').length;
		update((s) => ({ ...s, pendingCount: count }));
	}

	return {
		subscribe,
		triggerSync,
		manualSync,
		startAutoSync,
		stopAutoSync,
		updatePendingCount,
	};
}

export const syncStore = createSyncStore();

export async function triggerSync() {
	return syncStore.manualSync();
}

export async function startAutoSync() {
	syncStore.startAutoSync();
}

export async function stopAutoSync() {
	syncStore.stopAutoSync();
}