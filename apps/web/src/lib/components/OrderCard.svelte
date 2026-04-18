<script lang="ts">
	import { getNextStatus, getStatusColor, type Order } from '$lib/api/client';
	import { Clock, User, Package, ChevronDown, ChevronUp, Loader2, CreditCard } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	interface Props {
		order: Order;
		onStatusChange?: (id: string, newStatus: Order['status']) => Promise<void>;
	}

	let { order, onStatusChange }: Props = $props();

	let isExpanded = $state(false);
	let isUpdating = $state(false);

	const nextAction = $derived(getNextStatus(order.status));
	const statusColor = $derived(getStatusColor(order.status));
	const showPayButton = $derived(order.status === 'Selesai' && order.paymentStatus === 'Pending');

	function goToPendingPayment() {
		if (browser) {
			goto('/pos/pending');
		}
	}

	async function handleStatusUpdate() {
		if (!nextAction || !onStatusChange) return;

		isUpdating = true;
		try {
			await onStatusChange(order.id, nextAction.status);
		} finally {
			isUpdating = false;
		}
	}

	function formatTime(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function formatPrice(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div
	class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
>
	<button class="w-full p-4 text-left" onclick={() => (isExpanded = !isExpanded)} type="button">
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-xs font-medium px-2 py-0.5 rounded-full {statusColor}">
						{order.status}
					</span>
					<span class="text-xs text-rose-400 flex items-center gap-1">
						<Clock size={12} />
						{formatTime(order.createdAt)}
					</span>
				</div>

				<h3 class="font-semibold text-rose-900 truncate">{order.customerName}</h3>

				<div class="flex items-center gap-3 mt-1 text-xs text-rose-400">
					<span class="flex items-center gap-1">
						<Package size={12} />
						{order.items?.length || 0} item
					</span>
					<span class="flex items-center gap-1">
						<User size={12} />
						{order.orderType}
					</span>
				</div>
			</div>

			<div class="text-right">
				<p class="font-semibold text-rose-900">{formatPrice(order.totalAmount)}</p>
				{#if order.deliveryDate}
					<p class="text-[10px] text-rose-400">
						{new Date(order.deliveryDate).toLocaleDateString('id-ID', {
							day: 'numeric',
							month: 'short'
						})}
					</p>
				{/if}
			</div>

			{#if order.items?.length}
				<div class="text-rose-300">
					{#if isExpanded}
						<ChevronUp size={20} />
					{:else}
						<ChevronDown size={20} />
					{/if}
				</div>
			{/if}
		</div>
	</button>

	{#if isExpanded && order.items?.length}
		<div class="px-4 pb-4 border-t border-rose-50">
			<div class="pt-3 space-y-2">
				{#each order.items as item (item.id)}
					<div class="flex items-center justify-between text-sm">
						<span class="text-rose-700">
							{item.quantity}x {item.productName || `Product #${item.productId}`}
						</span>
						<span class="text-rose-500">
							{formatPrice(item.unitPriceAtOrder * item.quantity)}
						</span>
					</div>
					{#if item.notes}
						<p class="text-xs text-rose-400 italic pl-2">Note: {item.notes}</p>
					{/if}
				{/each}

				{#if order.messageCard}
					<div class="mt-2 p-2 bg-rose-50 rounded-lg">
						<p class="text-xs text-rose-500 font-medium">Ucapan:</p>
						<p class="text-xs text-rose-600 italic">"{order.messageCard}"</p>
						{#if order.senderName}
							<p class="text-xs text-rose-400 text-right">- {order.senderName}</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if showPayButton}
		<div class="px-4 pb-4">
			<button
				class="w-full py-2 px-4 rounded-xl font-medium text-sm transition-all bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
				onclick={goToPendingPayment}
				type="button"
			>
				<CreditCard size={16} />
				Bayar
			</button>
		</div>
	{:else if nextAction}
		<div class="px-4 pb-4">
			<button
				class="w-full py-2 px-4 rounded-xl font-medium text-sm transition-all
					{order.status === 'Antri'
					? 'bg-blue-500 hover:bg-blue-600 text-white'
					: order.status === 'Dirangkai'
						? 'bg-green-500 hover:bg-green-600 text-white'
						: 'bg-rose-500 hover:bg-rose-600 text-white'}"
				onclick={handleStatusUpdate}
				disabled={isUpdating}
				type="button"
			>
				{#if isUpdating}
					<span class="flex items-center justify-center gap-2">
						<Loader2 size={16} class="animate-spin" />
						Updating...
					</span>
				{:else}
					{nextAction.label}
				{/if}
			</button>
		</div>
	{/if}
</div>
