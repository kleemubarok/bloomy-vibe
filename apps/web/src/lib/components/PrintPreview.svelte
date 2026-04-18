<script lang="ts">
	import type { Order } from '$lib/api/client';
	import Receipt from './Receipt.svelte';
	import ProductionSlip from './ProductionSlip.svelte';
	import { triggerPrint } from '$lib/print/utils';
	import { Printer, X } from 'lucide-svelte';

	interface Props {
		order: Order;
		isOpen: boolean;
		onClose: () => void;
		paymentMethod?: string;
		amountPaid?: number;
		change?: number;
	}

	let {
		order,
		isOpen,
		onClose,
		paymentMethod = 'Cash',
		amountPaid = 0,
		change = 0
	}: Props = $props();

	let printType = $state<'receipt' | 'slip'>('receipt');

	function handlePrint() {
		triggerPrint();
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-lg font-semibold text-rose-900">Print Preview</h2>
				<button
					class="p-2 hover:bg-rose-100 rounded-full transition-colors"
					onclick={onClose}
					type="button"
				>
					<X size={20} class="text-rose-500" />
				</button>
			</div>

			<div class="flex gap-2 p-4 bg-rose-50">
				<button
					class="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors
						{printType === 'receipt' ? 'bg-rose-500 text-white' : 'bg-white text-rose-600 hover:bg-rose-100'}"
					onclick={() => (printType = 'receipt')}
					type="button"
				>
					Struk
				</button>
				<button
					class="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors
						{printType === 'slip' ? 'bg-rose-500 text-white' : 'bg-white text-rose-600 hover:bg-rose-100'}"
					onclick={() => (printType = 'slip')}
					type="button"
				>
					Slip Produksi
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-4 bg-rose-100">
				<div class="flex justify-center">
					{#if printType === 'receipt'}
						<Receipt {order} {paymentMethod} {amountPaid} {change} />
					{:else}
						<ProductionSlip {order} />
					{/if}
				</div>
			</div>

			<div class="p-4 border-t">
				<button
					class="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-semibold
						transition-colors flex items-center justify-center gap-2"
					onclick={handlePrint}
					type="button"
				>
					<Printer size={20} />
					Cetak
				</button>
			</div>
		</div>
	</div>
{/if}
