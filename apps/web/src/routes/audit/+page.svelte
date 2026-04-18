<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fetchWithAuth } from '$lib/api/client';
	import { Printer, TrendingUp, Package, DollarSign, X, ChevronRight } from 'lucide-svelte';

	let activeTab = $state<'summary' | 'orders' | 'inventory'>('summary');
	let isLoading = $state(true);
	let showPrintPreview = $state(false);

	let fromDate = $state('');
	let toDate = $state('');

	let summary = $state<{ totalOrders: number; totalRevenue: number; totalHpp: number; totalProfit: number } | null>(null);
	let orders = $state<any[]>([]);
	let inventoryLogs = $state<any[]>([]);

	let selectedOrder = $state<any>(null);
	let showOrderDetail = $state(false);

	onMount(async () => {
		await fetchSummary();
	});

	async function fetchSummary() {
		isLoading = true;
		try {
			let url = '/audit/summary';
			const params = new URLSearchParams();
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			if (params.toString()) url += '?' + params.toString();

			const res = await fetchWithAuth(url);
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
			const res = await fetchWithAuth('/audit/orders?limit=100');
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
			const res = await fetchWithAuth('/audit/inventory?limit=100');
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

	function openOrderDetail(order: any) {
		selectedOrder = order;
		showOrderDetail = true;
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

	{#if activeTab === 'summary'}
		<div class="flex gap-2 items-center bg-white p-3 rounded-xl border border-rose-100">
			<input
				type="date"
				bind:value={fromDate}
				class="px-3 py-2 rounded-lg border border-rose-200 text-sm"
				placeholder="Dari"
			/>
			<span class="text-rose-400">-</span>
			<input
				type="date"
				bind:value={toDate}
				class="px-3 py-2 rounded-lg border border-rose-200 text-sm"
				placeholder="Sampai"
			/>
			<button
				class="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium"
				onclick={fetchSummary}
			>
				Filter
			</button>
		</div>
	{/if}

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
				<button
					class="w-full bg-white rounded-xl p-4 border border-rose-100 flex justify-between items-center hover:bg-rose-50"
					onclick={() => openOrderDetail(order)}
				>
					<div class="text-left">
						<p class="font-medium text-rose-900">{order.customerName}</p>
						<p class="text-xs text-rose-400">{formatDate(order.createdAt)}</p>
					</div>
					<div class="text-right">
						<p class="font-medium text-rose-900">{formatCurrency(order.totalAmount)}</p>
						<p class="text-xs text-green-600">+{formatCurrency(order.profit)}</p>
					</div>
					<ChevronRight size={18} class="text-rose-300 ml-2" />
				</button>
			{/each}
		</div>
	{:else if activeTab === 'inventory' && inventoryLogs.length > 0}
		<div class="space-y-2">
			{#each inventoryLogs as log (log.id)}
				<div class="bg-white rounded-xl p-4 border border-rose-100">
					<div class="flex justify-between items-start">
						<div>
							<p class="font-medium text-rose-900">{log.name}</p>
							<p class="text-xs text-rose-400">
								{log.reason} • {formatDate(log.createdAt)}
								{#if log.orderId}
									<span class="ml-1 text-rose-500">#{log.orderId.slice(0, 8)}</span>
								{/if}
							</p>
						</div>
						<div class="text-right">
							<p class="font-medium {log.changeQty > 0 ? 'text-green-600' : 'text-red-600'}">
								{log.changeQty > 0 ? '+' : ''}{log.changeQty}
							</p>
							<p class="text-xs text-rose-400">
								{log.stockLevel} {log.unit}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 text-rose-300">Tidak ada data</div>
	{/if}
</div>

{#if showOrderDetail && selectedOrder}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => (showOrderDetail = false)}>
		<div
			class="bg-white rounded-2xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex justify-between items-center mb-4">
				<div>
					<h2 class="font-bold text-rose-900">Order Detail</h2>
					<p class="text-xs text-rose-400">{selectedOrder.id?.slice(0, 8)}</p>
				</div>
				<button class="text-rose-400" onclick={() => (showOrderDetail = false)}>
					<X size={20} />
				</button>
			</div>

			<div class="space-y-3">
				<div>
					<p class="text-xs text-rose-400">Customer</p>
					<p class="font-medium text-rose-900">{selectedOrder.customerName}</p>
					{#if selectedOrder.customerWhatsapp}
						<p class="text-xs text-rose-500">{selectedOrder.customerWhatsapp}</p>
					{/if}
				</div>

				<div>
					<p class="text-xs text-rose-400">Tanggal</p>
					<p class="text-sm text-rose-900">{formatDate(selectedOrder.createdAt)}</p>
				</div>

				<div class="border-t border-rose-100 pt-3">
					<p class="text-xs text-rose-400 mb-2">Items</p>
					<div class="space-y-2">
						{#each selectedOrder.items || [] as item}
							<div class="flex justify-between text-sm">
								<div>
									<p class="text-rose-900">{item.productName}</p>
									<p class="text-xs text-rose-400">x{item.quantity}</p>
								</div>
								<p class="text-rose-900">{formatCurrency(item.totalPrice)}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="border-t border-rose-100 pt-3 space-y-2">
					<div class="flex justify-between">
						<span class="text-rose-600">Total</span>
						<span class="font-medium">{formatCurrency(selectedOrder.totalAmount)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-rose-600">HPP</span>
						<span class="text-rose-900">{formatCurrency(selectedOrder.totalHppSnapshot || 0)}</span>
					</div>
					<div class="flex justify-between border-t border-rose-100 pt-2">
						<span class="font-medium text-green-700">Profit</span>
						<span class="font-bold text-green-700">{formatCurrency(selectedOrder.profit)}</span>
					</div>
				</div>
			</div>

			<button
				class="w-full mt-4 py-2 bg-rose-500 text-white rounded-xl font-medium"
				onclick={() => (showPrintPreview = true)}
			>
				Cetak Struk
			</button>
		</div>
	</div>
{/if}

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
					{#if fromDate || toDate}
						<p class="text-xs text-rose-400 mt-1">
							{fromDate || '-'} s/d {toDate || '-'}
						</p>
					{/if}
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