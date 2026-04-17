<script lang="ts">
	import { goto } from '$app/navigation';
	import { submitSelfOrder, type SelfOrderValidation, type SelfOrderSubmitData } from '$lib/api/client';
	import { Flower2, Loader2, CheckCircle, AlertCircle, Clock, Package } from 'lucide-svelte';

	let { data } = $props();

	let messageCard = $state('');
	let senderName = $state('');
	let deliveryDate = $state('');
	let customerWhatsapp = $state('');

	let isSubmitting = $state(false);
	let error = $state('');
	let submitted = $state(false);
	let submittedOrderId = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		isSubmitting = true;
		error = '';

		try {
			const submitData: SelfOrderSubmitData = {};
			if (messageCard) submitData.messageCard = messageCard;
			if (senderName) submitData.senderName = senderName;
			if (deliveryDate) submitData.deliveryDate = deliveryDate;
			if (customerWhatsapp) submitData.customerWhatsapp = customerWhatsapp;

			const result = await submitSelfOrder(data.uuid, submitData);
			submittedOrderId = result.orderId;
			submitted = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal mengirim pesanan';
		} finally {
			isSubmitting = false;
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
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const total = $derived(
		data.validation.product ? data.validation.product.basePrice * (data.validation.quantity || 1) : 0
	);
</script>

<svelte:head>
	<title>Pesan - Bloomy Craft</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-4">
	<div class="max-w-md mx-auto">
		{#if submitted}
			<div class="bg-white rounded-3xl p-8 shadow-xl text-center animate-in zoom-in duration-300">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<CheckCircle size={32} class="text-green-500" />
				</div>
				<h2 class="text-xl font-bold text-rose-900 mb-2">Pesanan Terkirim!</h2>
				<p class="text-rose-600 mb-6">
					Pesanan Anda sedang diproses. Kami akan menghubungi untuk konfirmasi.
				</p>
				{#if data.validation.product}
					<div class="bg-rose-50 rounded-xl p-4 text-left mb-6">
						<p class="text-sm text-rose-500">Detail Pesanan:</p>
						<p class="font-medium text-rose-900">{data.validation.product.name}</p>
						<p class="text-rose-500">x{data.validation.quantity || 1}</p>
						<p class="font-semibold text-rose-600 mt-2">{formatPrice(total)}</p>
					</div>
				{/if}
				<p class="text-xs text-rose-400">
					Order ID: {submittedOrderId.slice(0, 8)}...
				</p>
			</div>

		{:else if !data.validation.valid}
			<div class="bg-white rounded-3xl p-8 shadow-xl text-center">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<AlertCircle size={32} class="text-red-500" />
				</div>
				<h2 class="text-xl font-bold text-rose-900 mb-2">
					{#if data.validation.reason === 'expired'}
						Link Kadaluarsa
					{:else if data.validation.reason === 'used'}
						Link Sudah Digunakan
					{:else}
						Link Tidak Ditemukan
					{/if}
				</h2>
				<p class="text-rose-600">
					{#if data.validation.reason === 'expired'}
						Maaf, link ini sudah tidak berlaku. Silakan minta link baru dari pengirim.
					{:else if data.validation.reason === 'used'}
						Maaf, link ini sudah digunakan untuk memesan. Setiap link hanya bisa digunakan sekali.
					{:else}
						Maaf, link yang Anda masukkan tidak valid.
					{/if}
				</p>
			</div>

		{:else}
			<div class="space-y-4">
				<div class="bg-white rounded-2xl p-6 shadow-lg">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
							<Flower2 size={20} class="text-white" />
						</div>
						<div>
							<h1 class="font-bold text-rose-900">Bloomy Craft</h1>
							<p class="text-xs text-rose-400">Self-Order</p>
						</div>
					</div>

					{#if data.validation.expiresAt}
						<div class="flex items-center gap-2 text-xs text-rose-500 mb-4">
							<Clock size={12} />
							<span>Berlaku hingga {formatDate(data.validation.expiresAt)}</span>
						</div>
					{/if}
				</div>

				<div class="bg-white rounded-2xl p-6 shadow-lg">
					<h2 class="font-semibold text-rose-900 mb-4">Detail Pesanan</h2>
					
					{#if data.validation.product}
						<div class="bg-rose-50 rounded-xl p-4 mb-4">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
									<Package size={20} class="text-rose-400" />
								</div>
								<div class="flex-1">
									<p class="font-medium text-rose-900">{data.validation.product.name}</p>
									<p class="text-sm text-rose-500">{formatPrice(data.validation.product.basePrice)}</p>
								</div>
								<div class="text-right">
									<p class="font-bold text-rose-600">{formatPrice(total)}</p>
									<p class="text-xs text-rose-400">x{data.validation.quantity || 1}</p>
								</div>
							</div>
						</div>
					{/if}

					{#if data.validation.customerName}
						<div class="mb-4">
							<p class="text-xs text-rose-400">Untuk:</p>
							<p class="font-medium text-rose-900">{data.validation.customerName}</p>
						</div>
					{/if}
				</div>

				<form onsubmit={handleSubmit} class="bg-white rounded-2xl p-6 shadow-lg space-y-4">
					<h2 class="font-semibold text-rose-900">Tambah Keterangan</h2>

					<div>
						<label for="messageCard" class="block text-sm font-medium text-rose-700 mb-2">
							Ucapan di Kartu
						</label>
						<textarea
							id="messageCard"
							bind:value={messageCard}
							placeholder="Contoh: Selamat ulang tahun! Semoga sehat selalu."
							rows="3"
							maxlength="500"
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none"
						></textarea>
						<p class="text-xs text-rose-400 mt-1 text-right">{messageCard.length}/500</p>
					</div>

					<div>
						<label for="senderName" class="block text-sm font-medium text-rose-700 mb-2">
							Nama Pengirim
						</label>
						<input
							type="text"
							id="senderName"
							bind:value={senderName}
							placeholder="Siapa yang mengirim?"
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>

					<div>
						<label for="deliveryDate" class="block text-sm font-medium text-rose-700 mb-2">
							Jadwal Pengiriman
						</label>
						<input
							type="datetime-local"
							id="deliveryDate"
							bind:value={deliveryDate}
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>

					<div>
						<label for="customerWhatsapp" class="block text-sm font-medium text-rose-700 mb-2">
							No. WhatsApp (untuk konfirmasi)
						</label>
						<input
							type="tel"
							id="customerWhatsapp"
							bind:value={customerWhatsapp}
							placeholder="08xxxxxxxxxx"
							class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						/>
					</div>

					{#if error}
						<div class="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
							<AlertCircle size={16} />
							<span>{error}</span>
						</div>
					{/if}

					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
					>
						{#if isSubmitting}
							<Loader2 size={18} class="animate-spin" />
							<span>Mengirim...</span>
						{:else}
							<span>Kirim Pesanan</span>
						{/if}
					</button>
				</form>

				<p class="text-center text-xs text-rose-300 mt-4">
					© 2024 Bloomy Craft & Service
				</p>
			</div>
		{/if}
	</div>
</div>
