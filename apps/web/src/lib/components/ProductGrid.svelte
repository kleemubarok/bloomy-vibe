<script lang="ts">
	import type { Product } from '$lib/api/types';
	import { posStore } from '$lib/stores/pos.svelte';
	import { Package, Plus, Loader2 } from 'lucide-svelte';

	let { products, isLoading }: { products: Product[]; isLoading: boolean } = $props();

	function handleAddToCart(product: Product) {
		posStore.addToCart(product);
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold text-rose-900">Pilih Produk</h2>
		<span class="text-xs text-rose-400">{products.length} produk</span>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
			{#each [1, 2, 3, 4, 5, 6, 7, 8]}
				<div class="animate-pulse">
					<div class="bg-rose-100 rounded-2xl aspect-square"></div>
					<div class="mt-2 h-4 bg-rose-100 rounded w-3/4"></div>
					<div class="mt-1 h-3 bg-rose-100 rounded w-1/2"></div>
				</div>
			{/each}
		</div>
	{:else if products.length === 0}
		<div class="text-center py-12 text-rose-300">
			<Package size={48} class="mx-auto mb-3 opacity-50" />
			<p>Belum ada produk</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
			{#each products as product (product.id)}
				<button
					type="button"
					onclick={() => handleAddToCart(product)}
					class="bg-white rounded-2xl border border-rose-100 p-3 text-left hover:border-rose-300 hover:shadow-md transition-all group"
				>
					<div class="aspect-square bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center mb-3 group-hover:from-rose-200 group-hover:to-pink-200 transition-colors">
						<Package size={32} class="text-rose-400 group-hover:scale-110 transition-transform" />
					</div>
					<p class="font-medium text-rose-900 text-sm line-clamp-1">{product.name}</p>
					<p class="text-xs text-rose-400 mb-2">{product.category}</p>
					<div class="flex items-center justify-between">
						<span class="font-semibold text-rose-600 text-sm">{formatPrice(product.basePrice)}</span>
						<div class="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
							<Plus size={16} />
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
