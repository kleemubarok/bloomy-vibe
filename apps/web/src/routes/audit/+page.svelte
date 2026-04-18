<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchWithAuth } from '$lib/api/client';
	import { Printer, TrendingUp, Package, DollarSign } from 'lucide-svelte';

	let activeTab = $state<'summary' | 'orders' | 'inventory'>('summary');
	let isLoading = $state(true);
	let showPrintPreview = $state(false);

	let summary = $state<{ totalOrders: number; totalRevenue: number; totalHpp: number; totalProfit: number } | null>(null);
	let orders = $state<any[]>([]);
	let inventoryLogs = $state<any[]>([]);

	onMount(async () => {
		await fetchSummary();
	});

	async function fetchSummary() {
		isLoading = true;
		try {
			const res = await fetchWithAuth('/api/audit/summary');
			if (res.ok) {
				summary = await res.json();
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function fetchOrders() {
		isLoading = true;
		try {
			const res = await fetchWithAuth('/api/audit/orders?limit=100');
			if (res.ok) {
				orders = await res.json();
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function fetchInventory() {
		isLoading = true;
		try {
			const res = await fetchWithAuth('/api/audit/inventory?limit=100');
			if (res.ok) {
				inventoryLogs = await res.json();
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	function handleTabChange(tab: 'summary' | 'orders' | 'inventory') {
		activeTab = tab;
		if (tab === 'summary') fetchSummary();
		else if (tab === 'orders') fetchOrders();
		else if (tab === 'inventory') fetchInventory();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(amount);
	}

	function formatDate(date: string | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<svelte:head>
	<title>Audit - Bloomy POS</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center gap-4">
		<h1 class="text-2xl font-bold text-rose-900">Audit & Laporan</h1>
		<button
			class="ml-auto p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200"
			onclick={() => (showPrintPreview = true)}
		>
			<Printer size={20} />
		</button>
	</div>

	<div class="flex gap-2 border-b border-rose-100">
		<button
			class="px-4 py-2 font-medium transition-colors {activeTab === 'summary'
				? 'text-rose-600 border-b-2 border-rose-500'
				: 'text-rose-400 hover:text-rose-600'}"
			onclick={() => handleTabChange('summary')}
		>
			Ringkasan
		</button>
		<button
			class="px-4 py-2 font-medium transition-colors {activeTab === 'orders'
				? 'text-rose-600 border-b-2 border-rose-500'
				: 'text-rose-400 hover:text-rose-600'}"
			onclick={() => handleTabChange('orders')}
		>
			Orders
		</button>
		<button
			class="px-4 py-2 font-medium transition-colors {activeTab === 'inventory'
				? 'text-rose-600 border-b-2 border-rose-500'
				: 'text-rose-400 hover:text-rose-600'}"
			onclick={() => handleTabChange('inventory')}
		>
			Inventory
		</button>
	</div>

	{#if isLoading}
		<div class="text-center py-12 text-rose-300">Loading...</div>
	{:else if activeTab === 'summary' && summary}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-white rounded-2xl p-4 border border-rose-100">
				<div class="flex items-center gap-2 text-rose-400 mb-2">
					<Package size={18} />
					<span class="text-xs font-medium">Total Orders</span>
				</div>
				<p class="text-2xl font-bold text-rose-900">{summary.totalOrders}</p>
			</div>
			<div class="bg-white rounded-2xl p-4 border border-rose-100">
				<div class="flex items-center gap-2 text-rose-400 mb-2">
					<DollarSign size={18} />
					<span class="text-xs font-medium">Revenue</span>
				</div>
				<p class="text-xl font-bold text-rose-900">{formatCurrency(summary.totalRevenue)}</p>
			</div>
			<div class="bg-white rounded-2xl p-4 border border-rose-100">
				<div class="flex items-center gap-2 text-rose-400 mb-2">
					<TrendingUp size={18} />
					<span class="text-xs font-medium">HPP</span>
				</div>
				<p class="text-xl font-bold text-rose-900">{formatCurrency(summary.totalHpp)}</p>
			</div>
			<div class="bg-white rounded-2xl p-4 border border-rose-100 bg-green-50">
				<div class="flex items-center gap-2 text-green-600 mb-2">
					<TrendingUp size={18} />
					<span class="text-xs font-medium">Profit</span>
				</div>
				<p class="text-2xl font-bold text-green-700">{formatCurrency(summary.totalProfit)}</p>
			</div>
		</div>
	{:else if activeTab === 'orders' && orders.length > 0}
		<div class="space-y-2">
			{#each orders as order (order.id)}
				<div class="bg-white rounded-xl p-4 border border-rose-100 flex justify-between items-center">
					<div>
						<p class="font-medium text-rose-900">{order.customerName}</p>
						<p class="text-xs text-rose-400">{formatDate(order.createdAt)}</p>
					</div>
					<div class="text-right">
						<p class="font-medium text-rose-900">{formatCurrency(order.totalAmount)}</p>
						<p class="text-xs text-green-600">+{formatCurrency(order.profit)}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else if activeTab === 'inventory' && inventoryLogs.length > 0}
		<div class="space-y-2">
			{#each inventoryLogs as log (log.id)}
				<div class="bg-white rounded-xl p-4 border border-rose-100 flex justify-between items-center">
					<div>
						<p class="font-medium text-rose-900">{log.inventoryName}</p>
						<p class="text-xs text-rose-400">{log.reason} • {formatDate(log.createdAt)}</p>
					</div>
					<div class="text-right">
						<p class="font-medium {log.changeQty > 0 ? 'text-green-600' : 'text-red-600'}">
							{log.changeQty > 0 ? '+' : ''}{log.changeQty}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 text-rose-300">Tidak ada data</div>
	{/if}
</div>

{#if showPrintPreview}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => (showPrintPreview = false)}>
		<div
			class="bg-white rounded-2xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex justify-between items-center mb-4">
				<h2 class="font-bold text-rose-900">Print Preview</h2>
				<button class="text-rose-400" onclick={() => (showPrintPreview = false)}>✕</button>
			</div>

			<div class="space-y-4">
				<div class="text-center border-b border-rose-100 pb-4">
					<h3 class="font-bold text-lg">Bloomy Craft</h3>
					<p class="text-xs text-rose-500">Laporan Rugi Laba</p>
				</div>

				{#if summary}
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-rose-600">Total Order</span>
							<span class="font-medium">{summary.totalOrders}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-rose-600">Revenue</span>
							<span class="font-medium">{formatCurrency(summary.totalRevenue)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-rose-600">HPP</span>
							<span class="font-medium">{formatCurrency(summary.totalHpp)}</span>
						</div>
						<div class="flex justify-between border-t border-rose-100 pt-2">
							<span class="font-medium text-rose-900">Profit</span>
							<span class="font-bold text-green-700">{formatCurrency(summary.totalProfit)}</span>
						</div>
					</div>
				{/if}

				<div class="text-center text-xs text-rose-400 mt-4 pt-4 border-t border-rose-100">
					<p>{new Date().toLocaleDateString('id-ID')}</p>
				</div>
			</div>

			<button
				class="w-full mt-4 py-2 bg-rose-500 text-white rounded-xl font-medium"
				onclick={() => window.print()}
			>
				Cetak
			</button>
		</div>
	</div>
{/if}

<style>
	@media print {
		:global(body > :not(.print-area)) {
			display: none;
		}
	}
</style>