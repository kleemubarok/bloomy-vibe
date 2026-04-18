<script lang="ts">
	import type { Order } from '$lib/api/client';
	import { formatCurrency, formatDate, formatTime, truncateText } from '$lib/print/utils';
	import '$lib/print/styles.css';

	interface Props {
		order: Order;
		paymentMethod?: string;
		amountPaid?: number;
		change?: number;
	}

	let { order, paymentMethod = 'Cash', amountPaid = 0, change = 0 }: Props = $props();

	function getShortId(id: string): string {
		return id.slice(0, 8).toUpperCase();
	}
</script>

<div class="print-paper">
	<div class="print-header">
		<h1>BLOOMY CRAFT</h1>
		<p>&amp; SERVICE</p>
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row">
			<span class="label">No.</span>
			<span class="value">#{getShortId(order.id)}</span>
		</div>
		<div class="print-row">
			<span class="label">Tanggal</span>
			<span class="value">{formatDate(order.createdAt)}</span>
		</div>
		<div class="print-row">
			<span class="label">Jam</span>
			<span class="value">{formatTime(order.createdAt)}</span>
		</div>
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row">
			<span class="label">Pelanggan</span>
			<span class="value">{truncateText(order.customerName, 20)}</span>
		</div>
		{#if order.customerWhatsapp}
			<div class="print-row">
				<span class="label">WA</span>
				<span class="value">{truncateText(order.customerWhatsapp, 15)}</span>
			</div>
		{/if}
	</div>

	<hr class="print-divider" />

	<div class="print-items">
		{#if order.items && order.items.length > 0}
			{#each order.items as item (item.id)}
				<div class="print-item">
					<span class="print-item-name">
						{item.quantity}x {truncateText(item.productName || `Product #${item.productId}`, 18)}
					</span>
				</div>
				<div class="print-item" style="padding-left: 8px;">
					<span></span>
					<span class="print-item-price"
						>{formatCurrency(item.unitPriceAtOrder * item.quantity)}</span
					>
				</div>
			{/each}
		{/if}
	</div>

	<hr class="print-divider" />

	<div class="print-total">
		<div class="print-row">
			<span class="label">TOTAL</span>
			<span class="value">{formatCurrency(order.totalAmount)}</span>
		</div>
		{#if order.discountAmount > 0}
			<div class="print-row">
				<span class="label">DISKON</span>
				<span class="value">-{formatCurrency(order.discountAmount)}</span>
			</div>
		{/if}
		{#if amountPaid > 0}
			<div class="print-row">
				<span class="label">{paymentMethod === 'Cash' ? 'TUNAI' : paymentMethod.toUpperCase()}</span
				>
				<span class="value">{formatCurrency(amountPaid)}</span>
			</div>
		{/if}
		{#if change > 0}
			<div class="print-row">
				<span class="label">KEMBALI</span>
				<span class="value">{formatCurrency(change)}</span>
			</div>
		{/if}
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row">
			<span class="label">Bayar</span>
			<span class="value">{paymentMethod}</span>
		</div>
		<div class="print-row">
			<span class="label">Status</span>
			<span class="value">{order.paymentStatus}</span>
		</div>
	</div>

	{#if order.messageCard}
		<hr class="print-divider" />
		<div class="print-message-card">
			{truncateText(order.messageCard, 100)}
		</div>
		{#if order.senderName}
			<div class="print-text-right" style="font-size: 9px; margin-top: 4px;">
				- {order.senderName}
			</div>
		{/if}
	{/if}

	<div class="print-footer">
		<hr class="print-divider" />
		<p style="margin: 2px 0;">Terima Kasih!</p>
		<p style="margin: 2px 0;">bloomy.id</p>
	</div>
</div>
