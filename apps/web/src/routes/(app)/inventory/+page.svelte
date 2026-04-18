<script lang="ts">
	import { inventoryStore, type InventoryItem, type Product, type CreateProductData } from '$lib/stores/inventory.svelte';
	import { Plus, Pencil, Trash2, AlertTriangle, X, Package, Search } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let activeTab = $state<'inventory' | 'products'>('inventory');
	let showInventoryModal = $state(false);
	let showProductModal = $state(false);
	let editingInventory = $state<InventoryItem | null>(null);
	let editingProduct = $state<Product | null>(null);
	let isSubmitting = $state(false);
	let formError = $state<string | null>(null);

	let invSearchQuery = $state('');
	let prodSearchQuery = $state('');
	let categoryFilter = $state<string>('');

	function getFilteredInventory(items: InventoryItem[], query: string): InventoryItem[] {
		if (!query) return items;
		const q = query.toLowerCase();
		return items.filter(
			(item) =>
				item.name.toLowerCase().includes(q) ||
				(item.sku && item.sku.toLowerCase().includes(q))
		);
	}

	function getFilteredProducts(items: Product[], query: string, category: string): Product[] {
		let filtered = items;
		if (query) {
			const q = query.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.name.toLowerCase().includes(q) ||
					item.slug.toLowerCase().includes(q)
			);
		}
		if (category) {
			filtered = filtered.filter((item) => item.category === category);
		}
		return filtered;
	}

	let invForm = $state({
		name: '',
		sku: '',
		unit: '',
		stockLevel: 0,
		reorderLevel: 5
	});

	let prodForm = $state<CreateProductData>({
		name: '',
		slug: '',
		category: 'flower',
		basePrice: 0,
		isActive: true,
		recipes: []
	});

	onMount(() => {
		inventoryStore.fetchInventory();
		inventoryStore.fetchProducts();
	});

	function openInventoryModal(item?: InventoryItem) {
		if (item) {
			editingInventory = item;
			invForm = {
				name: item.name,
				sku: item.sku || '',
				unit: item.unit,
				stockLevel: item.stockLevel,
				reorderLevel: item.reorderLevel
			};
		} else {
			editingInventory = null;
			invForm = { name: '', sku: '', unit: '', stockLevel: 0, reorderLevel: 5 };
		}
		formError = null;
		showInventoryModal = true;
	}

	function closeInventoryModal() {
		showInventoryModal = false;
		editingInventory = null;
	}

	async function saveInventory() {
		if (!invForm.name || !invForm.unit) {
			formError = 'Nama dan Unit wajib diisi';
			return;
		}
		if (invForm.stockLevel < 0 || invForm.reorderLevel < 0) {
			formError = 'Stok tidak boleh negatif';
			return;
		}

		isSubmitting = true;
		try {
			if (editingInventory) {
				await inventoryStore.editInventoryItem(String(editingInventory.id), invForm);
			} else {
				await inventoryStore.addInventoryItem(invForm);
			}
			await inventoryStore.fetchInventory();
			closeInventoryModal();
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Gagal menyimpan';
		} finally {
			isSubmitting = false;
		}
	}

	async function removeInventoryItem(id: number) {
		if (!confirm('Yakin hapus item ini?')) return;
		try {
			await inventoryStore.removeInventoryItem(String(id));
			await inventoryStore.fetchInventory();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Gagal menghapus');
		}
	}

	function openProductModal(item?: Product) {
		if (item) {
			editingProduct = item;
			prodForm = {
				name: item.name,
				slug: item.slug,
				category: item.category,
				basePrice: item.basePrice,
				imageUrl: item.imageUrl || undefined,
				isActive: item.isActive,
				recipes: item.recipes.map((r) => ({
					inventoryId: r.inventoryId,
					quantityRequired: r.quantityRequired
				}))
			};
		} else {
			editingProduct = null;
			prodForm = {
				name: '',
				slug: '',
				category: 'flower',
				basePrice: 0,
				isActive: true,
				recipes: []
			};
		}
		formError = null;
		showProductModal = true;
	}

	function closeProductModal() {
		showProductModal = false;
		editingProduct = null;
	}

	function generateSlug(name: string) {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function addRecipeItem() {
		if (!prodForm.recipes) prodForm.recipes = [];
		prodForm.recipes = [...prodForm.recipes, { inventoryId: 0, quantityRequired: 1 }];
	}

	function removeRecipeItem(index: number) {
		if (!prodForm.recipes) return;
		prodForm.recipes = prodForm.recipes.filter((_, i) => i !== index);
	}

	async function saveProduct() {
		if (!prodForm.name || !prodForm.slug || !prodForm.category || prodForm.basePrice === undefined) {
			formError = 'Nama, Slug, Kategori, dan Harga wajib diisi';
			return;
		}

		isSubmitting = true;
		try {
			if (editingProduct) {
				await inventoryStore.editProduct(String(editingProduct.id), prodForm);
			} else {
				await inventoryStore.addProduct(prodForm);
			}
			await inventoryStore.fetchProducts();
			closeProductModal();
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Gagal menyimpan';
		} finally {
			isSubmitting = false;
		}
	}

	async function removeProductItem(id: number) {
		if (!confirm('Yakin hapus produk ini?')) return;
		try {
			await inventoryStore.removeProduct(String(id));
			await inventoryStore.fetchProducts();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Gagal menghapus');
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function getRecipeSummary(recipes: Product['recipes']): string {
		if (!recipes || recipes.length === 0) return '-';
		return recipes.map((r) => `${r.quantityRequired} ${r.inventoryName}`).join(', ');
	}
</script>

<div class="space-y-4">
	<!-- Tab Switcher -->
	<div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
		<div class="flex gap-2">
			<button
				class="px-4 py-2 rounded-lg font-medium transition-colors
					{activeTab === 'inventory'
						? 'bg-rose-500 text-white'
						: 'bg-rose-100 text-rose-600 hover:bg-rose-200'}"
				onclick={() => (activeTab = 'inventory')}
			>
				Bahan
			</button>
			<button
				class="px-4 py-2 rounded-lg font-medium transition-colors
					{activeTab === 'products'
						? 'bg-rose-500 text-white'
						: 'bg-rose-100 text-rose-600 hover:bg-rose-200'}"
				onclick={() => (activeTab = 'products')}
			>
				Produk
			</button>
		</div>

		{#if activeTab === 'inventory'}
			<div class="relative w-full sm:w-64">
				<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
				<input
					type="text"
					placeholder="Cari bahan..."
					bind:value={invSearchQuery}
					class="pl-10 pr-3 py-2 w-full border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
				/>
			</div>
		{:else}
			<div class="flex gap-2 w-full sm:w-auto">
				<div class="relative flex-1 sm:flex-none sm:w-48">
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
					<input
						type="text"
						placeholder="Cari produk..."
						bind:value={prodSearchQuery}
						class="pl-10 pr-3 py-2 w-full border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
				</div>
				<select
					bind:value={categoryFilter}
					class="px-3 py-2 border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
				>
					<option value="">Semua kategori</option>
					<option value="flower">Flower</option>
					<option value="craft">Craft</option>
					<option value="service">Service</option>
				</select>
			</div>
		{/if}
	</div>

	<!-- Inventory Tab -->
	{#if activeTab === 'inventory'}
		<div class="bg-white rounded-2xl border border-rose-100 overflow-hidden">
			<div class="flex items-center justify-between p-4 border-b border-rose-100">
				<h2 class="font-semibold text-rose-900">Daftar Bahan</h2>
				<button
					class="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
					onclick={() => openInventoryModal()}
				>
					<Plus size={16} />
					Tambah
				</button>
			</div>

			<table class="w-full">
				<thead class="bg-rose-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Nama</th
						>
						<th class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>SKU</th
						>
						<th class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Stok</th
						>
						<th class="px-4 py-3 text-center text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Unit</th
						>
						<th
							class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Limit</th
						>
						<th class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Aksi</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-rose-100">
					{#if inventoryStore.isLoading && inventoryStore.inventoryItems.length === 0}
						{#each [1, 2, 3] as _}
							<tr>
								<td class="px-4 py-3"
									><div class="h-4 w-24 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-16 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-12 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-12 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-12 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-8 w-20 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
							</tr>
						{/each}
					{:else if getFilteredInventory(inventoryStore.inventoryItems, invSearchQuery).length === 0}
						<tr>
							<td colspan="6" class="px-4 py-12 text-center text-rose-400">
								<Package size={32} class="mx-auto mb-2 opacity-50" />
								<p>{invSearchQuery ? 'Tidak ditemukan' : 'Belum ada bahan'}</p>
							</td>
						</tr>
					{:else}
						{#each getFilteredInventory(inventoryStore.inventoryItems, invSearchQuery) as item (item.id)}
							<tr class="hover:bg-rose-50/50 transition-colors">
								<td class="px-4 py-3">
									<div class="font-medium text-rose-900">{item.name}</div>
								</td>
								<td class="px-4 py-3 text-sm text-rose-500">{item.sku || '-'}</td>
								<td class="px-4 py-3 text-right">
									<span
										class="font-medium {item.stockLevel <= item.reorderLevel
											? 'text-amber-600'
											: 'text-rose-900'}"
									>
										{item.stockLevel}
										{#if item.stockLevel <= item.reorderLevel}
											<AlertTriangle
												size={14}
												class="inline ml-1 text-amber-500"
											/>
										{/if}
									</span>
								</td>
								<td class="px-4 py-3 text-center text-sm text-rose-600">{item.unit}</td>
								<td class="px-4 py-3 text-right text-sm text-rose-500">{item.reorderLevel}</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<button
											class="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
											onclick={() => openInventoryModal(item)}
											title="Edit"
										>
											<Pencil size={16} />
										</button>
										<button
											class="p-1.5 text-rose-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											onclick={() => removeInventoryItem(item.id)}
											title="Hapus"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Products Tab -->
	{#if activeTab === 'products'}
		<div class="bg-white rounded-2xl border border-rose-100 overflow-hidden">
			<div class="flex items-center justify-between p-4 border-b border-rose-100">
				<h2 class="font-semibold text-rose-900">Daftar Produk</h2>
				<button
					class="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
					onclick={() => openProductModal()}
				>
					<Plus size={16} />
					Tambah
				</button>
			</div>

			<table class="w-full">
				<thead class="bg-rose-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Nama</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Kategori</th
						>
						<th
							class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Harga</th
						>
						<th class="px-4 py-3 text-left text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Resep</th
						>
						<th class="px-4 py-3 text-right text-xs font-semibold text-rose-600 uppercase tracking-wider"
							>Aksi</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-rose-100">
					{#if inventoryStore.isLoading && inventoryStore.products.length === 0}
						{#each [1, 2, 3] as _}
							<tr>
								<td class="px-4 py-3"
									><div class="h-4 w-24 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-16 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-20 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-4 w-32 bg-rose-100 rounded animate-pulse"></div></td
								>
								<td class="px-4 py-3"
									><div class="h-8 w-20 bg-rose-100 rounded animate-pulse ml-auto"></div></td
								>
							</tr>
						{/each}
					{:else if getFilteredProducts(inventoryStore.products, prodSearchQuery, categoryFilter).length === 0}
						<tr>
							<td colspan="5" class="px-4 py-12 text-center text-rose-400">
								<Package size={32} class="mx-auto mb-2 opacity-50" />
								<p>{prodSearchQuery || categoryFilter ? 'Tidak ditemukan' : 'Belum ada produk'}</p>
							</td>
						</tr>
					{:else}
						{#each getFilteredProducts(inventoryStore.products, prodSearchQuery, categoryFilter) as product (product.id)}
							<tr class="hover:bg-rose-50/50 transition-colors">
								<td class="px-4 py-3">
									<div class="font-medium text-rose-900">{product.name}</div>
								</td>
								<td class="px-4 py-3">
									<span
										class="px-2 py-1 text-xs font-medium rounded-full
										{product.category === 'flower'
											? 'bg-pink-100 text-pink-700'
											: product.category === 'craft'
												? 'bg-amber-100 text-amber-700'
												: 'bg-blue-100 text-blue-700'}"
									>
										{product.category}
									</span>
								</td>
								<td class="px-4 py-3 text-right font-medium text-rose-900">
									{formatCurrency(product.basePrice)}
								</td>
								<td class="px-4 py-3 text-sm text-rose-600">
									{getRecipeSummary(product.recipes)}
								</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<button
											class="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
											onclick={() => openProductModal(product)}
											title="Edit"
										>
											<Pencil size={16} />
										</button>
										<button
											class="p-1.5 text-rose-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											onclick={() => removeProductItem(product.id)}
											title="Hapus"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Inventory Modal -->
{#if showInventoryModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-rose-900">
					{editingInventory ? 'Edit' : 'Tambah'} Bahan
				</h2>
				<button
					class="p-1 text-rose-400 hover:text-rose-600"
					onclick={closeInventoryModal}
				>
					<X size={20} />
				</button>
			</div>

			{#if formError}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
					{formError}
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="inv-name">
						Nama *
					</label>
					<input
						id="inv-name"
						type="text"
						bind:value={invForm.name}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						placeholder="Nama bahan"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="inv-sku">SKU</label>
					<input
						id="inv-sku"
						type="text"
						bind:value={invForm.sku}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						placeholder="Contoh: MW-001"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="inv-unit">
						Unit *
					</label>
					<select
						id="inv-unit"
						bind:value={invForm.unit}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
					>
						<option value="">Pilih unit</option>
						<option value="tangkai">Tangkai</option>
						<option value="meter">Meter</option>
						<option value="pcs">Pcs</option>
						<option value="roll">Roll</option>
						<option value="gram">Gram</option>
					</select>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-rose-700 mb-1" for="inv-stock">
							Stok Awal
						</label>
						<input
							id="inv-stock"
							type="number"
							min="0"
							bind:value={invForm.stockLevel}
							class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-rose-700 mb-1" for="inv-reorder">
							Level Pemesanan
						</label>
						<input
							id="inv-reorder"
							type="number"
							min="0"
							bind:value={invForm.reorderLevel}
							class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 pt-4">
				<button
					class="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
					onclick={closeInventoryModal}
				>
					Batal
				</button>
				<button
					class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
					onclick={saveInventory}
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Menyimpan...' : 'Simpan'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Product Modal with Recipe -->
{#if showProductModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-rose-900">
					{editingProduct ? 'Edit' : 'Tambah'} Produk
				</h2>
				<button class="p-1 text-rose-400 hover:text-rose-600" onclick={closeProductModal}>
					<X size={20} />
				</button>
			</div>

			{#if formError}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
					{formError}
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="prod-name">
						Nama Produk *
					</label>
					<input
						id="prod-name"
						type="text"
						bind:value={prodForm.name}
						oninput={() => {
							if (!editingProduct) {
								prodForm.slug = generateSlug(prodForm.name);
							}
						}}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						placeholder="Nama produk"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="prod-slug">
						Slug *
					</label>
					<input
						id="prod-slug"
						type="text"
						bind:value={prodForm.slug}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						placeholder="slug-produk"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-rose-700 mb-1" for="prod-category">
							Kategori *
						</label>
						<select
							id="prod-category"
							bind:value={prodForm.category}
							class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						>
							<option value="flower">Flower</option>
							<option value="craft">Craft</option>
							<option value="service">Service</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-rose-700 mb-1" for="prod-price">
							Harga *
						</label>
						<input
							id="prod-price"
							type="number"
							min="0"
							bind:value={prodForm.basePrice}
							class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
							placeholder="0"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-rose-700 mb-1" for="prod-image">
						Image URL
					</label>
					<input
						id="prod-image"
						type="url"
						bind:value={prodForm.imageUrl}
						class="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
						placeholder="https://..."
					/>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="prod-active"
						type="checkbox"
						bind:checked={prodForm.isActive}
						class="w-4 h-4 text-rose-500 border-rose-200 rounded focus:ring-rose-500"
					/>
					<label for="prod-active" class="text-sm text-rose-700">Produk aktif</label>
				</div>

				<!-- Recipe Section -->
				<div class="border-t border-rose-200 pt-4">
					<div class="flex items-center justify-between mb-3">
						<h3 class="font-medium text-rose-900">Resep Bahan</h3>
						<button
							type="button"
							class="text-sm text-rose-600 hover:text-rose-800 flex items-center gap-1"
							onclick={addRecipeItem}
						>
							<Plus size={14} />
							Tambah
						</button>
					</div>

					{#if !prodForm.recipes || prodForm.recipes.length === 0}
						<p class="text-sm text-rose-400 text-center py-4">
							Belum ada bahan. Klik "Tambah" untuk menambahkan.
						</p>
					{:else}
						<div class="space-y-2">
							{#each prodForm.recipes as recipe, index (index)}
								<div class="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
									<select
										bind:value={recipe.inventoryId}
										class="flex-1 px-2 py-1.5 text-sm border border-rose-200 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
									>
										<option value={0}>Pilih bahan</option>
										{#each inventoryStore.inventoryItems as inv (inv.id)}
											<option value={inv.id}>
												{inv.name} ({inv.unit})
											</option>
										{/each}
									</select>
									<input
										type="number"
										min="0.1"
										step="0.1"
										bind:value={recipe.quantityRequired}
										class="w-20 px-2 py-1.5 text-sm border border-rose-200 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
										placeholder="Jml"
									/>
									<button
										type="button"
										class="p-1.5 text-rose-400 hover:text-red-500 hover:bg-red-50 rounded"
										onclick={() => removeRecipeItem(index)}
									>
										<X size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="flex justify-end gap-2 pt-4">
				<button
					class="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
					onclick={closeProductModal}
				>
					Batal
				</button>
				<button
					class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
					onclick={saveProduct}
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Menyimpan...' : 'Simpan'}
				</button>
			</div>
		</div>
	</div>
{/if}