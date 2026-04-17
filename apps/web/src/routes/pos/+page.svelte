<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getProducts, createOrder, holdOrder, checkoutOrder, recordPayment, type Product, type PaymentMethod } from '$lib/api/client';
	import { posStore } from '$lib/stores/pos.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import ProductGrid from '$lib/components/ProductGrid.svelte';
	import { CheckCircle } from 'lucide-svelte';

	let products = $state<Product[]>([]);
	let isLoadingProducts = $state(true);
	let showSuccess = $state(false);
	let successMessage = $state('');

	onMount(async () => {
		if (!browser) return;
		
		try {
			products = await getProducts();
		} catch (error) {
			console.error('Failed to load products:', error);
		} finally {
			isLoadingProducts = false;
		}
	});

	async function handleHold() {
		if (posStore.items.length === 0 || !posStore.customerName) return;

		posStore.setProcessing(true);
		posStore.setError(null);

		try {
			const orderData = {
				customerName: posStore.customerName,
				customerWhatsapp: posStore.customerWhatsapp || undefined,
				items: posStore.items.map(item => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPriceAtOrder: item.unitPrice
				})),
				orderType: 'POS' as const
			};

			const order = await createOrder(orderData);
			await holdOrder(order.id);

			successMessage = 'Order dihold! Silakan menuju Dashboard untuk proses selanjutnya.';
			showSuccess = true;
			posStore.clearCart();

			setTimeout(() => {
				showSuccess = false;
			}, 4000);
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
				items: posStore.items.map(item => ({
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
			successMessage = change > 0 
				? `Pembayaran berhasil! Kembalian: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(change)}`
				: 'Pembayaran berhasil!';
			showSuccess = true;
			posStore.clearCart();

			setTimeout(() => {
				showSuccess = false;
			}, 5000);
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

{#if showSuccess}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-in zoom-in duration-200">
			<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<CheckCircle size={32} class="text-green-500" />
			</div>
			<h3 class="text-lg font-semibold text-rose-900 mb-2">Berhasil!</h3>
			<p class="text-rose-600 text-sm">{successMessage}</p>
		</div>
	</div>
{/if}

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
	<div class="lg:col-span-2 overflow-y-auto pr-2">
		<ProductGrid {products} isLoading={isLoadingProducts} />
	</div>

	<div class="lg:col-span-1">
		<div class="sticky top-4">
			<Cart onHold={handleHold} onPay={handlePay} />
		</div>
	</div>
</div>
