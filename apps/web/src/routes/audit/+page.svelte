<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fetchWithAuth } from '$lib/api/client';
	import { Printer, TrendingUp, Package, DollarSign, X, ChevronRight } from 'lucide-svelte';
	import { triggerPrint } from '$lib/print/utils';
	import Receipt from '$lib/components/Receipt.svelte';

	let activeTab = $state<'summary' | 'orders' | 'inventory'>('summary');
	let isLoading = $state(true);
	let showPrintPreview = $state(false);

	let summaryPeriod = $state('today');

	let summary = $state<{ totalOrders: number; totalRevenue: number; totalHpp: number; totalProfit: number } | null>(null);
	let orders = $state<any[]>([]);
	let inventoryLogs = $state<any[]>([]);

	let ordersPage = $state(1);
	let ordersTotalPages = $state(1);
	let ordersSearch = $state('');
	let inventoryPage = $state(1);
	let inventoryTotalPages = $state(1);
	let inventorySearch = $state('');

	let selectedOrder = $state<any>(null);
	let showOrderDetail = $state(false);
	let selectedInventoryLog = $state<any>(null);
	let showInventoryLogDetail = $state(false);
	let showReceiptPrint = $state(false);

	onMount(async () => {
		await fetchSummary();
	});

	async function fetchSummary() {
		isLoading = true;
		try {
			const res = await fetchWithAuth(`/audit/summary?period=${summaryPeriod}`);
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
			let url = `/audit/orders?page=${ordersPage}&limit=20`;
			if (ordersSearch) url += `&q=${encodeURIComponent(ordersSearch)}`;
			const res = await fetchWithAuth(url);
			if (res.ok) {
				const data = await res.json();
				orders = data.data;
				ordersTotalPages = data.totalPages;
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
			let url = `/audit/inventory?page=${inventoryPage}&limit=20`;
			if (inventorySearch) url += `&q=${encodeURIComponent(inventorySearch)}`;
			const res = await fetchWithAuth(url);
			if (res.ok) {
				const data = await res.json();
				inventoryLogs = data.data;
				inventoryTotalPages = data.totalPages;
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

	async function openOrderDetail(order: any) {
		isLoading = true;
		try {
			const res = await fetchWithAuth(`/audit/order/${order.id}`);
			if (res.ok) {
				selectedOrder = await res.json();
				showOrderDetail = true;
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function openInventoryLogDetail(log: any) {
		if (!log.orderId) return;
		isLoading = true;
		try {
			const res = await fetchWithAuth(`/audit/inventory-log/${log.id}`);
			if (res.ok) {
				selectedInventoryLog = await res.json();
				showInventoryLogDetail = true;
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	function handlePrintReceipt() {
		if (selectedOrder) {
			showReceiptPrint = true;
		}
	}

	function doPrint() {
		triggerPrint();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(amount);
	}

	function formatDate(date: string | number | null): string {
		if (!date) return '-';
		const d = typeof date === 'number' ? new Date(date) : new Date(date);
		if (isNaN(d.getTime())) return String(date);
		return d.toLocaleDateString('id-ID', {
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
			<select
				bind:value={summaryPeriod}
				onchange={fetchSummary}
				class="px-3 py-2 rounded-lg border border-rose-200 text-sm bg-white"
			>
				<option value="today">Today</option>
				<option value="yesterday">Yesterday</option>
				<option value="this_week">This Week</option>
				<option value="this_month">This Month</option>
				<option value="last_month">Last Month</option>
				<option value="all">All Time</option>
			</select>
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
{:else if activeTab === 'orders'}
		<div class="space-y-3">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={ordersSearch}
					placeholder="Cari customer..."
					class="flex-1 px-3 py-2 rounded-lg border border-rose-200 text-sm"
					onkeydown={(e) => e.key === 'Enter' && fetchOrders()}
				/>
				<button class="px-3 py-2 bg-rose-100 text-rose-600 rounded-lg" onclick={fetchOrders}>Cari</button>
			</div>
{#if orders.length === 0}
				<div class="text-center py-8 text-rose-400">
					<p>Tidak ada order ditemukan</p>
					{#if ordersSearch}
						<button class="text-rose-600 underline mt-2" onclick={() => { ordersSearch = ''; fetchOrders(); }}>
							Clear search
						</button>
					{/if}
				</div>
			{:else}
				<div class="space-y-2">
				{#each orders as order (order.id)}
					<button
						class="w-full bg-white rounded-xl p-4 border border-rose-100 hover:bg-rose-50 text-left"
						onclick={() => openOrderDetail(order)}
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="font-medium text-rose-900">{order.customerName}</p>
								<p class="text-xs text-rose-400">{formatDate(order.createdAt)}</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-rose-900">{formatCurrency(order.totalAmount)}</p>
								<p class="text-xs text-green-600">Profit: +{formatCurrency(order.profit)}</p>
							</div>
						</div>
					</button>
				{/each}
				</div>
				<div class="flex justify-center gap-2">
					<button
						class="px-3 py-1 rounded bg-rose-100 text-rose-600 disabled:opacity-50"
						disabled={ordersPage <= 1}
						onclick={() => { ordersPage--; fetchOrders(); }}
					>
						&lt;
					</button>
					<span class="px-3 py-1">{ordersPage} / {ordersTotalPages}</span>
					<button
						class="px-3 py-1 rounded bg-rose-100 text-rose-600 disabled:opacity-50"
						disabled={ordersPage >= ordersTotalPages}
						onclick={() => { ordersPage++; fetchOrders(); }}
					>
						&gt;
					</button>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'inventory' && inventoryLogs.length > 0}
		<div class="space-y-3">
			<div class="space-y-2">
				{#each inventoryLogs as log (log.id)}
					<button
						class="w-full bg-white rounded-xl p-4 border border-rose-100 text-left hover:bg-rose-50 {log.orderId ? '' : 'opacity-60'}"
						onclick={() => openInventoryLogDetail(log)}
						disabled={!log.orderId}
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="font-medium text-rose-900">{log.name}</p>
								<p class="text-xs text-rose-400">
									{log.reason} • {formatDate(log.createdAt)}
								</p>
							</div>
							<div class="text-right">
								<p class="font-medium {log.changeQty > 0 ? 'text-green-600' : 'text-red-600'}">
									{log.changeQty > 0 ? '+' : ''}{log.changeQty}
								</p>
							</div>
						</div>
						{#if log.orderId}
							<p class="text-xs text-rose-500 mt-1">#{log.orderId.slice(0, 8)} - Klik untuk detail</p>
						{/if}
					</button>
				{/each}
			</div>
			<div class="flex justify-center gap-2">
				<button
					class="px-3 py-1 rounded bg-rose-100 text-rose-600 disabled:opacity-50"
					disabled={inventoryPage <= 1}
					onclick={() => { inventoryPage--; fetchInventory(); }}
				>
					&lt;
				</button>
				<span class="px-3 py-1">{inventoryPage} / {inventoryTotalPages}</span>
				<button
					class="px-3 py-1 rounded bg-rose-100 text-rose-600 disabled:opacity-50"
					disabled={inventoryPage >= inventoryTotalPages}
					onclick={() => { inventoryPage++; fetchInventory(); }}
				>
					&gt;
				</button>
			</div>
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
				onclick={handlePrintReceipt}
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
					<p class="text-xs text-rose-400 mt-1 uppercase">{summaryPeriod}</p>
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

{#if showInventoryLogDetail && selectedInventoryLog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => (showInventoryLogDetail = false)}>
		<div class="bg-white rounded-2xl p-4 max-w-sm w-full" onclick={(e) => e.stopPropagation()}>
			<div class="flex justify-between items-center mb-4">
				<h2 class="font-bold text-rose-900">Inventory Log</h2>
				<button class="text-rose-400" onclick={() => (showInventoryLogDetail = false)}><X size={20} /></button>
			</div>
			{#if selectedInventoryLog.order}
				<div class="space-y-3">
					<div><p class="text-xs text-rose-400">Order</p><p class="font-medium">{selectedInventoryLog.order.customerName}</p></div>
					<div><p class="text-xs text-rose-400">Total</p><p class="font-medium">{formatCurrency(selectedInventoryLog.order.totalAmount)}</p></div>
					<button class="w-full mt-4 py-2 bg-rose-500 text-white rounded-xl font-medium" onclick={() => { showInventoryLogDetail = false; openOrderDetail(selectedInventoryLog.order); }}>Lihat Detail Order</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showReceiptPrint && selectedOrder}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => (showReceiptPrint = false)}>
		<div class="bg-white rounded-2xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<div class="flex justify-between items-center mb-4">
				<h2 class="font-bold text-rose-900">Print Struk</h2>
				<button class="text-rose-400" onclick={() => (showReceiptPrint = false)}><X size={20} /></button>
			</div>
			<div class="print-paper">
				<Receipt order={selectedOrder} paymentMethod="Cash" amountPaid={selectedOrder.totalAmount} change={0} />
			</div>
			<button class="w-full mt-4 py-2 bg-rose-500 text-white rounded-xl font-medium" onclick={doPrint}>
				Cetak Sekarang
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