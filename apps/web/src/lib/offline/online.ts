import { writable, readonly, type Readable } from 'svelte/store';

export interface OnlineState {
	isOnline: boolean;
	lastChecked: string | null;
}

const initialState: OnlineState = {
	isOnline: true,
	lastChecked: null,
};

function createOnlineStore() {
	const { subscribe, set, update } = writable<OnlineState>(initialState);

	let checkInterval: ReturnType<typeof setInterval> | null = null;
	const CHECK_INTERVAL_MS = 30000;

	function checkOnline(): boolean {
		const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
		update((state) => ({
			...state,
			isOnline: online,
			lastChecked: new Date().toISOString(),
		}));
		return online;
	}

	function startPolling() {
		if (checkInterval) return;
		checkOnline();
		checkInterval = setInterval(checkOnline, CHECK_INTERVAL_MS);
	}

	function stopPolling() {
		if (checkInterval) {
			clearInterval(checkInterval);
			checkInterval = null;
		}
	}

	function init() {
		if (typeof window === 'undefined') return;

		checkOnline();

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		startPolling();
	}

	function destroy() {
		if (typeof window === 'undefined') return;

		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);

		stopPolling();
	}

	function handleOnline() {
		update((state) => ({ ...state, isOnline: true }));
	}

	function handleOffline() {
		update((state) => ({ ...state, isOnline: false }));
	}

	return {
		subscribe,
		init,
		destroy,
		checkOnline,
		startPolling,
		stopPolling,
	};
}

export const onlineStore = createOnlineStore();

export function isOnline(): boolean {
	if (typeof navigator === 'undefined') return true;
	return navigator.onLine;
}

export function initOnlineDetection() {
	onlineStore.init();
}

export function destroyOnlineDetection() {
	onlineStore.destroy();
}