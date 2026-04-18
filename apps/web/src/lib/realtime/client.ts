import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface RealtimeEvent {
	type: 'connected' | 'disconnected' | 'status_update' | 'heartbeat' | 'error';
	orderId?: string;
	status?: string;
	timestamp: number;
	message?: string;
}

export interface RealtimeState {
	connected: boolean;
	lastEvent: string | null;
	reconnectAttempts: number;
}

const POLLING_INTERVAL_MS = 10000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

function createRealtimeStore() {
	const { subscribe, set, update } = writable<RealtimeState>({
		connected: false,
		lastEvent: null,
		reconnectAttempts: 0,
	});

	let eventSource: EventSource | null = null;
	let pollingInterval: ReturnType<typeof setInterval> | null = null;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let isManualClose = false;

	function connect() {
		if (!browser) return;

		isManualClose = false;
		cleanup();

		try {
			eventSource = new EventSource('/api/sse/status');

			eventSource.onopen = () => {
				update((s) => ({ ...s, connected: true, reconnectAttempts: 0 }));
				stopPolling();
			};

			eventSource.onmessage = (event) => {
				try {
					const data: RealtimeEvent = JSON.parse(event.data);
					update((s) => ({ ...s, lastEvent: event.data }));

					if (data.type === 'status_update') {
						dispatchEvent(new CustomEvent('order-status-update', { detail: data }));
					}
				} catch {
					console.error('Failed to parse SSE event:', event.data);
				}
			};

			eventSource.onerror = () => {
				update((s) => ({ ...s, connected: false }));
				cleanup();
				scheduleReconnect();
			};
		} catch (error) {
			console.error('Failed to connect SSE:', error);
			startPolling();
		}
	}

	function scheduleReconnect() {
		if (isManualClose) return;

		update((s) => {
			if (s.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
				startPolling();
				return s;
			}
			return { ...s, reconnectAttempts: s.reconnectAttempts + 1 };
		});

		if (reconnectTimeout) clearTimeout(reconnectTimeout);
		reconnectTimeout = setTimeout(() => {
			connect();
		}, RECONNECT_DELAY_MS);
	}

	function startPolling() {
		if (pollingInterval) return;

		pollingInterval = setInterval(async () => {
			try {
				const res = await fetch('/api/orders', {
					headers: { 'Cache-Control': 'no-cache' },
				});
				if (res.ok) {
					update((s) => ({ ...s, lastEvent: new Date().toISOString() }));
					dispatchEvent(new CustomEvent('order-status-update', { detail: { type: 'polling', timestamp: Date.now() } }));
				}
			} catch {
				console.error('Polling failed');
			}
		}, POLLING_INTERVAL_MS);
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	function cleanup() {
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
	}

	function disconnect() {
		isManualClose = true;
		cleanup();
		stopPolling();
		update((s) => ({ ...s, connected: false }));
	}

	return {
		subscribe,
		connect,
		disconnect,
		startPolling,
		stopPolling,
	};
}

export const realtimeStore = createRealtimeStore();

export function initRealtime() {
	realtimeStore.connect();
}

export function disconnectRealtime() {
	realtimeStore.disconnect();
}

export function onOrderStatusUpdate(callback: (event: CustomEvent<RealtimeEvent>) => void) {
	if (!browser) return () => {};

	const handler = (e: Event) => callback(e as CustomEvent<RealtimeEvent>);
	window.addEventListener('order-status-update', handler);
	return () => window.removeEventListener('order-status-update', handler);
}