<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		getProducts,
		createOrder,
		holdOrder,
		checkoutOrder,
		recordPayment,
		type Product,
		type PaymentMethod,
		type Order
	} from '$lib/api/client';
	import { posStore } from '$lib/stores/pos.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import ProductGrid from '$lib/components/ProductGrid.svelte';
	import PrintPreview from '$lib/components/PrintPreview.svelte';
	import { CheckCircle, X, Clock, Search, ShoppingCart } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let products = $state<Product[]>([]);
	let filteredProducts = $state<Product[]>([]);
	let isLoadingProducts = $state(true);
	let showSuccess = $state(false);
	let successMessage = $state('');
	let showPrintPreview = $state(false);
	let lastOrder = $state<Order | null>(null);
	let lastPaymentMethod = $state<PaymentMethod>('Cash');
	let lastAmountPaid = $state(0);
	let lastChange = $state(0);
	let searchQuery = $state('');
	let showMobileCart = $state(false);

	onMount(async () => {
		if (!browser) return;

		try {
			products = await getProducts();
			filteredProducts = products;
		} catch (error) {
			console.error('Failed to load products:', error);
		} finally {
			isLoadingProducts = false;
		}
	});

	function handleSearch() {
		if (!searchQuery.trim()) {
			filteredProducts = products;
		} else {
			const q = searchQuery.toLowerCase();
			filteredProducts = products.filter(
				(p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
			);
		}
	}

	$effect(() => {
		handleSearch();
	});

	async function handleHold() {
		if (posStore.items.length === 0 || !posStore.customerName) return;

		posStore.setProcessing(true);
		posStore.setError(null);

		try {
			const orderData = {
				customerName: posStore.customerName,
				customerWhatsapp: posStore.customerWhatsapp || undefined,
				items: posStore.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPriceAtOrder: item.unitPrice
				})),
				orderType: 'POS' as const
			};

			const order = await createOrder(orderData);
			await holdOrder(order.id);

			lastOrder = {
				...order,
				items: orderData.items.map((item, i) => ({
					...item,
					id: String(i),
					productName:
						products.find((p) => p.id === item.productId)?.name || `Product #${item.productId}`
				}))
			};
			lastPaymentMethod = 'Cash';
			lastAmountPaid = 0;
			lastChange = 0;

			successMessage = 'Order dihold! Silakan menuju Dashboard untuk proses selanjutnya.';
			showSuccess = true;
			posStore.clearCart();
		} catch (error) {
			posStore.setError(error instanceof Error ? error.message : 'Gagal hold order');
		} finally {
			posStore.setProcessing(false);
		}
	}

	async function handlePay(method: PaymentMethod, amountPaid: number) {
		if (posStore.items.length === 0 || !posStore.customerName) return;

		posStore.setProcessing(true);
		posStore.setError(null);

		try {
			const orderData = {
				customerName: posStore.customerName,
				customerWhatsapp: posStore.customerWhatsapp || undefined,
				items: posStore.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPriceAtOrder: item.unitPrice
				})),
				orderType: 'POS' as const
			};

			const order = await createOrder(orderData);
			await holdOrder(order.id);

			const paymentResult = await recordPayment({
				orderId: order.id,
				method,
				amount: method === 'Cash' ? amountPaid : posStore.getTotal(),
				reference: undefined
			});

			if (paymentResult.paymentStatus === 'Paid') {
				await checkoutOrder(order.id);
			}

			const change = method === 'Cash' ? Math.max(0, amountPaid - posStore.getTotal()) : 0;
			const calculatedChange = change;
			successMessage =
				change > 0
					? `Pembayaran berhasil! Kembalian: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(change)}`
					: 'Pembayaran berhasil!';

			lastOrder = {
				...order,
				items: orderData.items.map((item, i) => ({
					...item,
					id: String(i),
					productName:
						products.find((p) => p.id === item.productId)?.name || `Product #${item.productId}`
				}))
			};
			lastPaymentMethod = method;
			lastAmountPaid = amountPaid;
			lastChange = calculatedChange;
			showSuccess = true;
			posStore.clearCart();
		} catch (error) {
			posStore.setError(error instanceof Error ? error.message : 'Gagal memproses pembayaran');
		} finally {
			posStore.setProcessing(false);
		}
	}
</script>

<svelte:head>
	<title>POS - Bloomy POS</title>
</svelte:head>

<div class="flex items-center justify-between mb-4">
	<h1 class="text-2xl font-bold text-rose-900">POS</h1>
	<button
		class="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition-colors"
		onclick={() => goto('/pos/pending')}
		type="button"
	>
		<Clock size={18} />
		<span class="hidden sm:inline">Pending</span>
	</button>
</div>

<!-- Search Bar -->
<div class="relative mb-4 md:hidden">
	<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
	<input
		type="text"
		placeholder="Cari produk..."
		bind:value={searchQuery}
		class="w-full pl-10 pr-4 py-2 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
	/>
</div>

<!-- Floating Cart Button (Mobile Only) -->
{#if posStore.getItemCount() > 0}
	<button
		type="button"
		onclick={() => (showMobileCart = true)}
		class="fixed bottom-16 right-4 z-40 md:hidden bg-rose-500 text-white p-4 rounded-full shadow-lg shadow-rose-300 animate-bounce"
	>
		<ShoppingCart size={24} />
		<span class="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
			{posStore.getItemCount()}
		</span>
	</button>
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

{#if lastOrder}
	<PrintPreview
		order={lastOrder}
		isOpen={showPrintPreview}
		onClose={() => (showPrintPreview = false)}
		paymentMethod={lastPaymentMethod}
		amountPaid={lastAmountPaid}
		change={lastChange}
	/>
{/if}

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
	<div class="lg:col-span-2 overflow-y-auto pr-2">
		<ProductGrid products={filteredProducts} isLoading={isLoadingProducts} />
	</div>

	<div class="lg:col-span-1 hidden md:block">
		<div class="sticky top-4">
			<Cart onHold={handleHold} onPay={handlePay} />
		</div>
	</div>
</div>

<!-- Mobile Cart Modal -->
{#if showMobileCart}
	<div class="fixed inset-0 z-50 md:hidden">
		<div class="absolute inset-0 bg-black/50" onclick={() => (showMobileCart = false)}></div>
		<div class="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
			<div class="flex items-center justify-between p-4 border-b border-rose-100">
				<h2 class="font-semibold text-rose-900">Keranjang</h2>
				<button onclick={() => (showMobileCart = false)} class="p-2 hover:bg-rose-50 rounded-full">
					<X size={20} class="text-rose-400" />
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-4">
				<Cart onHold={handleHold} onPay={handlePay} />
			</div>
		</div>
	</div>
{/if}
