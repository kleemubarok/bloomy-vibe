<script lang="ts">
	import { productionStore } from '$lib/stores/production.svelte';
	import { getNextStatus, type Order } from '$lib/api/client';
	import OrderCard from '$lib/components/OrderCard.svelte';
	import { Inbox, RefreshCw } from 'lucide-svelte';

	let viewMode = $state<'kanban' | 'list'>('kanban');

	const columns: { status: Order['status']; label: string; color: string }[] = [
		{ status: 'Antri', label: 'Antri', color: 'border-amber-400' },
		{ status: 'Dirangkai', label: 'Dirangkai', color: 'border-blue-500' },
		{ status: 'Selesai', label: 'Selesai', color: 'border-green-500' }
	];

	async function handleStatusChange(id: string, newStatus: Order['status']) {
		await productionStore.updateOrderStatus(id, newStatus);
	}

	function getColumnOrders(status: Order['status']): Order[] {
		return productionStore.orders.filter((o) => o.status === status);
	}

	async function handleRefresh() {
		await productionStore.fetchActiveOrders();
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<button
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					{viewMode === 'kanban' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}"
				onclick={() => (viewMode = 'kanban')}
				type="button"
			>
				Kanban
			</button>
			<button
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					{viewMode === 'list' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}"
				onclick={() => (viewMode = 'list')}
				type="button"
			>
				List
			</button>
		</div>

		<button
			class="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
			onclick={handleRefresh}
			disabled={productionStore.isLoading}
			type="button"
			title="Refresh"
		>
			<RefreshCw size={18} class={productionStore.isLoading ? 'animate-spin' : ''} />
		</button>
	</div>

	{#if viewMode === 'kanban'}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each columns as column (column.status)}
				{@const orders = getColumnOrders(column.status)}
				<div class="bg-rose-50/50 rounded-2xl p-4 min-h-[400px]">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full {column.color.replace('border-', 'bg-')}"></div>
							<h2 class="font-semibold text-rose-900">{column.label}</h2>
						</div>
						<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-white text-rose-500">
							{orders.length}
						</span>
					</div>

					<div class="space-y-3">
						{#if productionStore.isLoading && orders.length === 0}
							<div class="animate-pulse space-y-3">
								{#each [1, 2, 3]}
									<div class="bg-white rounded-2xl h-24"></div>
								{/each}
							</div>
						{:else if orders.length === 0}
							<div class="flex flex-col items-center justify-center py-12 text-rose-300">
								<Inbox size={32} class="mb-2 opacity-50" />
								<p class="text-sm">Tidak ada order</p>
							</div>
						{:else}
							{#each orders as order (order.id)}
								<OrderCard {order} onStatusChange={handleStatusChange} />
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-white rounded-2xl border border-rose-100 overflow-hidden">
			<table class="w-full">
				<thead class="bg-rose-50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Customer</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Status</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Items</th
						>
						<th
							class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Total</th
						>
						<th
							class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Aksi</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-rose-100">
					{#if productionStore.isLoading && productionStore.orders.length === 0}
						{#each [1, 2, 3]}
							<tr>
								<td class="px-4 py-3"
									><div class="h-4 w-24 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-16 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-12 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-20 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-8 w-24 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
							</tr>
						{/each}
					{:else if productionStore.orders.length === 0}
						<tr>
							<td colspan="5" class="px-4 py-12 text-center text-rose-400">
								<Inbox size={32} class="mx-auto mb-2 opacity-50" />
								<p>Tidak ada order aktif</p>
							</td>
						</tr>
					{:else}
						{#each productionStore.orders as order (order.id)}
							<tr class="hover:bg-rose-50/50 transition-colors">
								<td class="px-4 py-3">
									<div class="font-medium text-rose-900">{order.customerName}</div>
									{#if order.customerWhatsapp}
										<div class="text-xs text-rose-400">{order.customerWhatsapp}</div>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span
										class="px-2 py-1 text-xs font-medium rounded-full
										{order.status === 'Antri'
											? 'bg-amber-100 text-amber-700'
											: order.status === 'Dirangkai'
												? 'bg-blue-100 text-blue-700'
												: 'bg-green-100 text-green-700'}"
									>
										{order.status}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-rose-600">{order.items?.length || 0}</td>
								<td class="px-4 py-3 text-right font-medium text-rose-900">
									{new Intl.NumberFormat('id-ID', {
										style: 'currency',
										currency: 'IDR',
										minimumFractionDigits: 0
									}).format(order.totalAmount)}
								</td>
								<td class="px-4 py-3 text-right">
									{#if getNextStatus(order.status)}
										<button
											class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
												{order.status === 'Antri'
												? 'bg-blue-500 hover:bg-blue-600 text-white'
												: order.status === 'Dirangkai'
													? 'bg-green-500 hover:bg-green-600 text-white'
													: 'bg-rose-500 hover:bg-rose-600 text-white'}"
											onclick={() =>
												handleStatusChange(order.id, getNextStatus(order.status)!.status)}
											type="button"
										>
											{getNextStatus(order.status)!.label}
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
