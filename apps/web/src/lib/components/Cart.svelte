<script lang="ts">
	import { posStore } from '$lib/stores/pos.svelte';
	import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-svelte';

	let { 
		onHold, 
		onCheckout 
	}: { 
		onHold: () => Promise<void>;
		onCheckout: () => Promise<void>;
	} = $props();
</script>

<div class="bg-white rounded-2xl border border-rose-100 shadow-lg h-full flex flex-col">
	<div class="p-4 border-b border-rose-100">
		<div class="flex items-center gap-2">
			<ShoppingCart size={20} class="text-rose-500" />
			<h2 class="font-semibold text-rose-900">Keranjang</h2>
			{#if posStore.getItemCount() > 0}
				<span class="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
					{posStore.getItemCount()}
				</span>
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-3">
		{#if posStore.items.length === 0}
			<div class="text-center py-8 text-rose-300">
				<ShoppingCart size={40} class="mx-auto mb-2 opacity-50" />
				<p class="text-sm">Keranjang kosong</p>
			</div>
		{:else}
			{#each posStore.items as item (item.productId)}
				<div class="bg-rose-50 rounded-xl p-3">
					<div class="flex items-start justify-between gap-2">
						<div class="flex-1 min-w-0">
							<p class="font-medium text-rose-900 text-sm truncate">{item.productName}</p>
							<p class="text-xs text-rose-500">
								{new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR',
									minimumFractionDigits: 0
								}).format(item.unitPrice)}
							</p>
						</div>
						<button
							type="button"
							onclick={() => posStore.removeFromCart(item.productId)}
							class="p-1 text-rose-400 hover:text-rose-600 transition-colors"
						>
							<Trash2 size={16} />
						</button>
					</div>
					<div class="flex items-center justify-between mt-2">
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => posStore.updateQuantity(item.productId, item.quantity - 1)}
								class="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors"
							>
								<Minus size={14} />
							</button>
							<span class="w-8 text-center font-medium text-rose-900">{item.quantity}</span>
							<button
								type="button"
								onclick={() => posStore.updateQuantity(item.productId, item.quantity + 1)}
								class="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors"
							>
								<Plus size={14} />
							</button>
						</div>
						<p class="font-semibold text-rose-900 text-sm">
							{new Intl.NumberFormat('id-ID', {
								style: 'currency',
								currency: 'IDR',
								minimumFractionDigits: 0
							}).format(item.unitPrice * item.quantity)}
						</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if posStore.error}
		<div class="px-4 pb-2">
			<div class="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
				<AlertCircle size={16} />
				<span>{posStore.error}</span>
			</div>
		</div>
	{/if}

	<div class="p-4 border-t border-rose-100 space-y-3">
		<div class="space-y-2">
			<label for="customerName" class="block text-xs font-medium text-rose-700">Nama Pelanggan *</label>
			<input
				type="text"
				id="customerName"
				value={posStore.customerName}
				oninput={(e) => posStore.setCustomerName(e.currentTarget.value)}
				placeholder="Masukkan nama"
				class="w-full px-3 py-2 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
			/>
		</div>
		<div class="space-y-2">
			<label for="customerWhatsapp" class="block text-xs font-medium text-rose-700">No. WhatsApp</label>
			<input
				type="tel"
				id="customerWhatsapp"
				value={posStore.customerWhatsapp}
				oninput={(e) => posStore.setCustomerWhatsapp(e.currentTarget.value)}
				placeholder="08xxxxxxxxxx"
				class="w-full px-3 py-2 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
			/>
		</div>

		<div class="flex items-center justify-between py-2 border-t border-rose-100">
			<span class="font-semibold text-rose-900">Total</span>
			<span class="text-lg font-bold text-rose-600">
				{new Intl.NumberFormat('id-ID', {
					style: 'currency',
					currency: 'IDR',
					minimumFractionDigits: 0
				}).format(posStore.getTotal())}
			</span>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={onHold}
				disabled={posStore.items.length === 0 || !posStore.customerName || posStore.isProcessing}
				class="py-2.5 px-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
			>
				Hold
			</button>
			<button
				type="button"
				onclick={onCheckout}
				disabled={posStore.items.length === 0 || !posStore.customerName || posStore.isProcessing}
				class="py-2.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
			>
				Checkout
			</button>
		</div>
	</div>
</div>
