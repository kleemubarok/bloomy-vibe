<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getProducts, generateSelfOrderLink, getSelfOrderLinks, deleteSelfOrderLink, type Product, type SelfOrderLinkItem } from '$lib/api/client';
	import { Link, Copy, Check, Loader2, Package, ExternalLink, Trash2 } from 'lucide-svelte';

	let products = $state<Product[]>([]);
	let links = $state<SelfOrderLinkItem[]>([]);
	let isLoading = $state(true);
	let isGenerating = $state(false);
	let isDeleting = $state<number | null>(null);
	let error = $state('');

	let selectedProductId = $state<number | null>(null);
	let quantity = $state(1);
	let customerName = $state('');

	let generatedLinkId = $state<number | null>(null);
	let copied = $state(false);

	onMount(async () => {
		if (!browser) return;
		
		await Promise.all([loadProducts(), loadLinks()]);
	});

	async function loadProducts() {
		try {
			products = await getProducts();
		} catch (e) {
			error = 'Gagal memuat produk';
		} finally {
			isLoading = false;
		}
	}

	async function loadLinks() {
		try {
			links = await getSelfOrderLinks();
		} catch (e) {
			console.error('Gagal memuat links:', e);
		}
	}

	async function handleGenerate() {
		if (!selectedProductId || !customerName) return;

		isGenerating = true;
		error = '';

		try {
			const result = await generateSelfOrderLink({
				productId: selectedProductId,
				quantity,
				customerName
			});
			generatedLinkId = result.id;
			await loadLinks();
			
			selectedProductId = null;
			quantity = 1;
			customerName = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal generate link';
		} finally {
			isGenerating = false;
		}
	}

	async function handleDelete(id: number) {
		if (isDeleting !== null) return;
		
		isDeleting = id;
		try {
			await deleteSelfOrderLink(id);
			await loadLinks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal hapus link';
		} finally {
			isDeleting = null;
		}
	}

	async function copyToClipboard(uuid: string) {
		const url = `${window.location.origin}/order/${uuid}`;
		try {
			await navigator.clipboard.writeText(url);
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

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getLinkStatus(link: SelfOrderLinkItem): { label: string; color: string } {
		if (link.isUsed) return { label: 'Sudah Digunakan', color: 'bg-gray-100 text-gray-500' };
		if (new Date(link.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
		return { label: 'Aktif', color: 'bg-green-100 text-green-600' };
	}

	function isLinkActive(link: SelfOrderLinkItem): boolean {
		return !link.isUsed && new Date(link.expiresAt) > new Date();
	}

	const selectedProduct = $derived(products.find(p => p.id === selectedProductId));
</script>

<svelte:head>
	<title>Self-Order - Bloomy POS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center gap-3 mb-6">
		<div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
			<Link size={20} class="text-rose-500" />
		</div>
		<div>
			<h1 class="text-xl font-bold text-rose-900">Self-Order Links</h1>
			<p class="text-sm text-rose-400">Buat & kelola link pesanan untuk pelanggan</p>
		</div>
	</div>

	<div class="bg-white rounded-2xl border border-rose-100 p-6 space-y-6">
		<h2 class="font-semibold text-rose-900">Generate Link Baru</h2>

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

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

					{#if selectedProduct}
						<div class="flex items-center">
							<div class="bg-rose-50 rounded-xl p-4 flex items-center gap-3 w-full">
								<div class="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
									<Package size={18} class="text-rose-400" />
								</div>
								<div>
									<p class="font-medium text-rose-900">{selectedProduct.name}</p>
									<p class="text-sm text-rose-500">{formatPrice(selectedProduct.basePrice)}</p>
								</div>
							</div>
						</div>
					{/if}
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

	<div class="bg-white rounded-2xl border border-rose-100 overflow-hidden">
		<div class="p-4 border-b border-rose-100">
			<h2 class="font-semibold text-rose-900">Link yang Dibuat</h2>
		</div>

		{#if links.length === 0}
			<div class="p-8 text-center text-rose-300">
				<Link size={32} class="mx-auto mb-2 opacity-50" />
				<p>Belum ada link yang dibuat</p>
			</div>
		{:else}
			<div class="divide-y divide-rose-100">
				{#each links as link (link.id)}
					{@const status = getLinkStatus(link)}
					{@const isActive = isLinkActive(link)}
					<div class="p-4 flex items-center gap-4 hover:bg-rose-50/50 transition-colors">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<p class="font-medium text-rose-900 truncate">{link.productName || 'Produk'}</p>
								<span class="px-2 py-0.5 text-xs rounded-full {status.color}">
									{status.label}
								</span>
							</div>
							<p class="text-sm text-rose-500">
								{link.customerName} • x{link.quantity} • {formatPrice((link.productPrice || 0) * link.quantity)}
							</p>
							<p class="text-xs text-rose-400">
								{#if link.isUsed}
									Digunakan
								{:else if isActive}
									Berlaku hingga {formatDate(link.expiresAt)}
								{:else}
									Expired {formatDate(link.expiresAt)}
								{/if}
							</p>
						</div>

						<div class="flex items-center gap-2">
							{#if isActive}
								<button
									type="button"
									onclick={() => copyToClipboard(link.uuid)}
									class="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
									title="Copy Link"
								>
									{#if copied}
										<Check size={18} />
									{:else}
										<Copy size={18} />
									{/if}
								</button>
							{/if}
							
							<button
								type="button"
								onclick={() => handleDelete(link.id)}
								disabled={isDeleting === link.id}
								class="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
								title="Hapus Link"
							>
								{#if isDeleting === link.id}
									<Loader2 size={18} class="animate-spin" />
								{:else}
									<Trash2 size={18} />
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
