<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		getOrders,
		recordPayment,
		checkoutOrder,
		type Order,
		type PaymentMethod
	} from '$lib/api/client';
	import { Search, CreditCard, X, CheckCircle } from 'lucide-svelte';
	import PrintPreview from '$lib/components/PrintPreview.svelte';

	let pendingOrders = $state<Order[]>([]);
	let filteredOrders = $state<Order[]>([]);
	let searchQuery = $state('');
	let isLoading = $state(true);
	let showPaymentModal = $state(false);
	let selectedOrder = $state<Order | null>(null);
	let showSuccess = $state(false);
	let showPrintPreview = $state(false);
	let successMessage = $state('');

	let paymentMethod = $state<PaymentMethod>('Cash');
	let amountPaid = $state(0);
	let isProcessing = $state(false);

	let lastPaidOrder = $state<Order | null>(null);
	let lastPaymentMethod = $state<PaymentMethod>('Cash');
	let lastAmountPaid = $state(0);
	let lastChange = $state(0);

	onMount(async () => {
		if (!browser) return;
		await fetchPendingOrders();
	});

	async function fetchPendingOrders() {
		isLoading = true;
		try {
			const allOrders = await getOrders();
			pendingOrders = allOrders.filter((o) => o.paymentStatus === 'Pending');
			filteredOrders = pendingOrders;
		} catch (e) {
			console.error('Failed to fetch pending orders:', e);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		const query = searchQuery.toLowerCase();
		if (!query) {
			filteredOrders = pendingOrders;
		} else {
			filteredOrders = pendingOrders.filter(
				(o) =>
					o.customerName.toLowerCase().includes(query) ||
					(o.customerWhatsapp && o.customerWhatsapp.includes(query)) ||
					o.id.slice(-6).toLowerCase().includes(query)
			);
		}
	});

	function openPaymentModal(order: Order) {
		selectedOrder = order;
		paymentMethod = 'Cash';
		amountPaid = order.totalAmount;
		showPaymentModal = true;
	}

	function closePaymentModal() {
		showPaymentModal = false;
		selectedOrder = null;
	}

	async function handlePay() {
		if (!selectedOrder || isProcessing) return;

		isProcessing = true;
		try {
			const paymentResult = await recordPayment({
				orderId: selectedOrder.id,
				method: paymentMethod,
				amount: paymentMethod === 'Cash' ? amountPaid : selectedOrder.totalAmount,
				reference: undefined
			});

			if (paymentResult.paymentStatus === 'Paid' && selectedOrder.status !== 'Selesai') {
				await checkoutOrder(selectedOrder.id);
			}

			const change =
				paymentMethod === 'Cash' ? Math.max(0, amountPaid - selectedOrder.totalAmount) : 0;

			lastPaidOrder = {
				...selectedOrder,
				items: selectedOrder.items || []
			};
			lastPaymentMethod = paymentMethod;
			lastAmountPaid = amountPaid;
			lastChange = change;

			successMessage =
				change > 0
					? `Pembayaran berhasil! Kembalian: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(change)}`
					: 'Pembayaran berhasil!';

			showPaymentModal = false;
			showSuccess = true;

			await fetchPendingOrders();

			setTimeout(() => {
				showSuccess = false;
			}, 5000);
		} catch (e) {
			console.error('Payment failed:', e);
		} finally {
			isProcessing = false;
		}
	}

	function getChange(): number {
		if (!selectedOrder) return 0;
		return Math.max(0, amountPaid - selectedOrder.totalAmount);
	}

	const paymentMethods: { value: PaymentMethod; label: string }[] = [
		{ value: 'Cash', label: 'Tunai' },
		{ value: 'QRIS', label: 'QRIS' },
		{ value: 'Transfer', label: 'Transfer' }
	];
</script>

<svelte:head>
	<title>Pending - Bloomy POS</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center gap-4">
		<h1 class="text-2xl font-bold text-rose-900">Pending Payment</h1>
		<button
			class="ml-auto px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-200 transition-colors"
			onclick={fetchPendingOrders}
			type="button"
		>
			Refresh
		</button>
	</div>

	<div class="relative">
		<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Cari nama, no WA, atau no order..."
			class="w-full pl-10 pr-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
		/>
	</div>

	{#if isLoading}
		<div class="text-center py-12 text-rose-300">
			<p>Loading...</p>
		</div>
	{:else if filteredOrders.length === 0}
		<div class="text-center py-12 text-rose-300">
			<CreditCard size={40} class="mx-auto mb-2 opacity-50" />
			<p>Tidak ada order pending</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredOrders as order (order.id)}
				<button
					class="w-full text-left bg-white rounded-2xl border border-rose-100 p-4 hover:shadow-md transition-shadow"
					onclick={() => openPaymentModal(order)}
					type="button"
				>
					<div class="flex items-start justify-between">
						<div>
							<p class="font-semibold text-rose-900">{order.customerName}</p>
							{#if order.customerWhatsapp}
								<p class="text-sm text-rose-500">{order.customerWhatsapp}</p>
							{/if}
							<p class="text-xs text-rose-400 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
						</div>
						<div class="text-right">
							<p class="font-bold text-rose-900">
								{new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR',
									minimumFractionDigits: 0
								}).format(order.totalAmount)}
							</p>
							<span class="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
								Pending
							</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if showPaymentModal && selectedOrder}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-3xl p-6 max-w-sm w-full relative">
			<button
				class="absolute top-4 right-4 p-2 hover:bg-rose-100 rounded-full transition-colors"
				onclick={closePaymentModal}
				type="button"
			>
				<X size={20} class="text-rose-400" />
			</button>

			<h3 class="text-lg font-semibold text-rose-900 mb-2 pr-8">Pembayaran</h3>
			<p class="text-sm text-rose-500 mb-4">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-rose-700 mb-2">Metode Bayar</label>
					<div class="grid grid-cols-3 gap-2">
						{#each paymentMethods as method}
							<button
								type="button"
								onclick={() => (paymentMethod = method.value)}
								class="py-2 px-3 text-sm font-medium rounded-xl border transition-all
									{paymentMethod === method.value
									? 'bg-rose-500 text-white border-rose-500'
									: 'bg-white text-rose-600 border-rose-200 hover:border-rose-300'}"
							>
								{method.label}
							</button>
						{/each}
					</div>
				</div>

				{#if paymentMethod === 'Cash'}
					<div>
						<label for="amountPaid" class="block text-sm font-medium text-rose-700 mb-2"
							>Jumlah Bayar</label
						>
						<input
							type="number"
							id="amountPaid"
							bind:value={amountPaid}
							min={selectedOrder.totalAmount}
							class="w-full px-3 py-2 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>

					<div class="flex justify-between py-2 border-t border-rose-100">
						<span class="text-rose-600">Kembalian</span>
						<span class="font-bold text-rose-600">
							{new Intl.NumberFormat('id-ID', {
								style: 'currency',
								currency: 'IDR',
								minimumFractionDigits: 0
							}).format(getChange())}
						</span>
					</div>
				{:else}
					<div class="p-4 bg-rose-50 rounded-xl text-center">
						<p class="text-rose-600 text-sm">
							{new Intl.NumberFormat('id-ID', {
								style: 'currency',
								currency: 'IDR',
								minimumFractionDigits: 0
							}).format(selectedOrder.totalAmount)}
						</p>
					</div>
				{/if}
			</div>

			<div class="flex gap-2 mt-6">
				<button
					type="button"
					onclick={closePaymentModal}
					class="flex-1 py-2.5 px-3 bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-200 transition-all"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handlePay}
					disabled={isProcessing ||
						(paymentMethod === 'Cash' && amountPaid < selectedOrder.totalAmount)}
					class="flex-1 py-2.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
				>
					{#if isProcessing}
						<span class="animate-spin">⟳</span>
					{/if}
					Bayar Sekarang
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showSuccess}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-in zoom-in duration-200 relative"
		>
			<button
				class="absolute top-4 right-4 p-2 hover:bg-rose-100 rounded-full transition-colors"
				onclick={() => (showSuccess = false)}
				type="button"
			>
				<X size={20} class="text-rose-400" />
			</button>
			<div
				class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
			>
				<CheckCircle size={32} class="text-green-500" />
			</div>
			<h3 class="text-lg font-semibold text-rose-900 mb-2">Berhasil!</h3>
			<p class="text-rose-600 text-sm mb-4">{successMessage}</p>
			<button
				class="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-semibold transition-colors"
				onclick={() => (showPrintPreview = true)}
				type="button"
			>
				Cetak Struk
			</button>
		</div>
	</div>
{/if}

{#if lastPaidOrder}
	<PrintPreview
		order={lastPaidOrder}
		isOpen={showPrintPreview}
		onClose={() => (showPrintPreview = false)}
		paymentMethod={lastPaymentMethod}
		amountPaid={lastAmountPaid}
		change={lastChange}
	/>
{/if}
