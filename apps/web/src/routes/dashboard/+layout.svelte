<script lang="ts">
	import { productionStore } from '$lib/stores/production.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { RotateCw, AlertCircle } from 'lucide-svelte';

	let { children } = $props();

	onMount(() => {
		productionStore.fetchActiveOrders();
		productionStore.startPolling(30000);
	});

	onDestroy(() => {
		productionStore.stopPolling();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-rose-900">Dashboard Produksi</h1>
			<p class="text-sm text-rose-400">Tracking status order secara realtime</p>
		</div>

		{#if productionStore.lastFetched}
			<div class="flex items-center gap-2 text-xs text-rose-400">
				<RotateCw size={14} class="opacity-50" />
				Updated {productionStore.lastFetched.toLocaleTimeString('id-ID')}
			</div>
		{/if}
	</div>

	{#if productionStore.error}
		<div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
			<AlertCircle size={20} class="text-red-500 flex-shrink-0" />
			<div class="flex-1">
				<p class="text-sm font-medium text-red-700">{productionStore.error}</p>
			</div>
			<button
				class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
				onclick={() => productionStore.fetchActiveOrders()}
				type="button"
			>
				Retry
			</button>
		</div>
	{/if}

	{@render children()}
</div>
