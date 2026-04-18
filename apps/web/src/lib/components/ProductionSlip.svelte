<script lang="ts">
	import type { Order } from '$lib/api/client';
	import { formatDate, formatTime, truncateText } from '$lib/print/utils';
	import '$lib/print/styles.css';

	interface Props {
		order: Order;
	}

	let { order }: Props = $props();

	function getShortId(id: string): string {
		return id.slice(0, 8).toUpperCase();
	}
</script>

<div class="print-paper">
	<div class="print-header">
		<h1>SLIP PRODUKSI</h1>
		<p>#{getShortId(order.id)}</p>
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row">
			<span class="label">Tgl</span>
			<span class="value">{formatDate(order.createdAt)}</span>
		</div>
		<div class="print-row">
			<span class="label">Jam</span>
			<span class="value">{formatTime(order.createdAt)}</span>
		</div>
		{#if order.deliveryDate}
			<div class="print-row">
				<span class="label">Kirim</span>
				<span class="value">{formatDate(order.deliveryDate)}</span>
			</div>
		{/if}
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row">
			<span class="label">Pelanggan</span>
			<span class="value">{truncateText(order.customerName, 18)}</span>
		</div>
	</div>

	<hr class="print-divider" />

	<div class="print-section">
		<div class="print-row print-text-center" style="font-weight: bold;">
			<span>ITEM</span>
			<span style="margin-left: auto;">QTY</span>
		</div>
		{#if order.items && order.items.length > 0}
			{#each order.items as item (item.id)}
				<div class="print-item">
					<span class="print-item-name">
						{truncateText(item.productName || `Product #${item.productId}`, 16)}
					</span>
					<span class="print-item-qty">x{item.quantity}</span>
				</div>
			{/each}
		{/if}
	</div>

	{#if order.messageCard}
		<hr class="print-divider" />
		<div class="print-section">
			<div class="print-row">
				<span class="label">Pesan</span>
			</div>
			<div class="print-message">
				{truncateText(order.messageCard, 80)}
			</div>
			{#if order.senderName}
				<div class="print-text-right" style="font-size: 9px; margin-top: 2px;">
					dr: {order.senderName}
				</div>
			{/if}
		</div>
	{/if}

	<hr class="print-divider" />

	<div class="print-checklist">
		<span class="print-checkbox">
			<span class="print-checkbox-box"></span>
			Baru
		</span>
		<span class="print-checkbox">
			<span class="print-checkbox-box"></span>
			Rangkai
		</span>
		<span class="print-checkbox">
			<span class="print-checkbox-box"></span>
			Selesai
		</span>
		<span class="print-checkbox">
			<span class="print-checkbox-box"></span>
			Serah
		</span>
	</div>

	<div class="print-footer">
		<p style="margin: 4px 0 0 0;">Bloomy Craft & Service</p>
	</div>
</div>
