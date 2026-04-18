<script lang="ts">
	import { onlineStore } from '$lib/offline/online';
	import { syncStore } from '$lib/offline/sync';
	import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-svelte';

	let isSyncing = $state(false);
	let isOnline = $state(true);
	let lastSynced = $state<string | null>(null);
	let lastError = $state<string | null>(null);
	let pendingCount = $state(0);

	$effect(() => {
		const unsubOnline = onlineStore.subscribe((s) => {
			isOnline = s.isOnline;
		});

		const unsubSync = syncStore.subscribe((s) => {
			isSyncing = s.isSyncing;
			lastSynced = s.lastSynced;
			lastError = s.lastError;
			pendingCount = s.pendingCount;
		});

		return () => {
			unsubOnline();
			unsubSync();
		};
	});

	async function handleManualSync() {
		await syncStore.manualSync();
	}

	function formatLastSync(dateStr: string | null): string {
		if (!dateStr) return 'Belum pernah';
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		if (diff < 60000) return 'Baru saja';
		if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
		return date.toLocaleDateString('id-ID');
	}
</script>

<div class="flex items-center gap-2 text-sm">
	{#if !isOnline}
		<div class="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
			<WifiOff size={14} />
			<span class="text-xs">Offline</span>
		</div>
	{:else if pendingCount > 0}
		<button
			type="button"
			class="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200 transition-colors"
			onclick={handleManualSync}
			disabled={isSyncing}
		>
			{#if isSyncing}
				<RefreshCw size={14} class="animate-spin" />
			{:else}
				<AlertCircle size={14} />
			{/if}
			<span class="text-xs">{pendingCount} pending</span>
		</button>
	{:else if lastError}
		<div class="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full">
			<AlertCircle size={14} />
			<span class="text-xs">{lastError}</span>
		</div>
	{:else}
		<div class="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
			<CheckCircle size={14} />
			<span class="text-xs">{formatLastSync(lastSynced)}</span>
		</div>
	{/if}
</div>