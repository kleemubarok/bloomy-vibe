<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getProducts, generateSelfOrderLink, type Product } from '$lib/api/client';
	import { goto } from '$app/navigation';
	import { Link, Copy, Check, Loader2, Package, ExternalLink } from 'lucide-svelte';

	let products = $state<Product[]>([]);
	let isLoading = $state(true);
	let isGenerating = $state(false);
	let error = $state('');

	let selectedProductId = $state<number | null>(null);
	let quantity = $state(1);
	let customerName = $state('');

	let generatedLink = $state('');
	let copied = $state(false);

	onMount(async () => {
		if (!browser) return;
		
		try {
			products = await getProducts();
		} catch (e) {
			error = 'Gagal memuat produk';
		} finally {
			isLoading = false;
		}
	});

	async function handleGenerate() {
		if (!selectedProductId || !customerName) return;

		isGenerating = true;
		error = '';
		copied = false;

		try {
			const result = await generateSelfOrderLink({
				productId: selectedProductId,
				quantity,
				customerName
			});
			generatedLink = result.link;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal generate link';
		} finally {
			isGenerating = false;
		}
	}

	async function copyToClipboard() {
		if (!generatedLink) return;
		
		try {
			await navigator.clipboard.writeText(generatedLink);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch (e) {
			error = 'Gagal copy ke clipboard';
		}
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	}

	const selectedProduct = $derived(products.find(p => p.id === selectedProductId));
</script>

<svelte:head>
	<title>Self-Order - Bloomy POS</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-3 mb-6">
		<div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
			<Link size={20} class="text-rose-500" />
		</div>
		<div>
			<h1 class="text-xl font-bold text-rose-900">Generate Self-Order Link</h1>
			<p class="text-sm text-rose-400">Buat link untuk pelanggan pesan sendiri</p>
		</div>
	</div>

	<div class="bg-white rounded-2xl border border-rose-100 p-6 space-y-6">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<Loader2 size={24} class="animate-spin text-rose-400" />
			</div>
		{:else}
			<div class="space-y-4">
				<div>
					<a 
						href="/inventory" 
						class="inline-flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 mb-4"
					>
						<ExternalLink size={14} />
						Kelola produk di Inventory
					</a>
				</div>

				<div>
					<label for="product" class="block text-sm font-medium text-rose-700 mb-2">Pilih Produk</label>
					<select
						id="product"
						bind:value={selectedProductId}
						class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
					>
						<option value={null}>-- Pilih Produk --</option>
						{#each products as product}
							<option value={product.id}>
								{product.name} - {formatPrice(product.basePrice)}
							</option>
						{/each}
					</select>
				</div>

				{#if selectedProduct}
					<div class="bg-rose-50 rounded-xl p-4">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
								<Package size={20} class="text-rose-400" />
							</div>
							<div>
								<p class="font-medium text-rose-900">{selectedProduct.name}</p>
								<p class="text-sm text-rose-500">{formatPrice(selectedProduct.basePrice)}</p>
							</div>
						</div>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="quantity" class="block text-sm font-medium text-rose-700 mb-2">Jumlah</label>
						<input
							type="number"
							id="quantity"
							bind:value={quantity}
							min="1"
							max="99"
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>

					<div>
						<label for="customerName" class="block text-sm font-medium text-rose-700 mb-2">Nama Pelanggan</label>
						<input
							type="text"
							id="customerName"
							bind:value={customerName}
							placeholder="Nama penerima"
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
						{error}
					</div>
				{/if}

				<button
					type="button"
					onclick={handleGenerate}
					disabled={!selectedProductId || !customerName || isGenerating}
					class="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
				>
					{#if isGenerating}
						<Loader2 size={18} class="animate-spin" />
						<span>Generating...</span>
					{:else}
						<Link size={18} />
						<span>Generate Link</span>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if generatedLink}
		<div class="bg-white rounded-2xl border border-green-200 p-6 space-y-4">
			<div class="flex items-center gap-2 text-green-600">
				<Check size={20} />
				<span class="font-medium">Link berhasil dibuat!</span>
			</div>

			<div class="bg-rose-50 rounded-xl p-4">
				<p class="text-xs text-rose-500 mb-2">Link Self-Order:</p>
				<div class="flex items-center gap-2">
					<input
						type="text"
						value={generatedLink}
						readonly
						class="flex-1 px-3 py-2 bg-white rounded-lg border border-rose-200 text-sm text-rose-900"
					/>
					<button
						type="button"
						onclick={copyToClipboard}
						class="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
					>
						{#if copied}
							<Check size={16} />
							<span>Copied!</span>
						{:else}
							<Copy size={16} />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</div>

			<p class="text-xs text-rose-400">
				Link berlaku 12 jam. Kirimkan link ini ke pelanggan untuk membuat pesanan.
			</p>
		</div>
	{/if}
</div>
