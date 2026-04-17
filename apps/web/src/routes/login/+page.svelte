<script lang="ts">
	import { login, isAuthenticated } from '$lib/api/client';
	import { goto } from '$app/navigation';
	import { Flower2, Loader2, AlertCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let email = $state('');
	let pin = $state('');
	let isLoading = $state(false);
	let error = $state('');

	onMount(() => {
		if (isAuthenticated()) {
			goto('/dashboard');
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		try {
			await login(email, pin);
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Login failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Bloomy POS</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="flex flex-col items-center mb-8">
			<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-200 mb-4">
				<Flower2 size={32} class="text-white" />
			</div>
			<h1 class="text-2xl font-bold text-rose-900">Bloomy POS</h1>
			<p class="text-sm text-rose-400 mt-1">Craft & Service</p>
		</div>

		<!-- Login Form -->
		<div class="bg-white rounded-3xl p-8 shadow-xl shadow-rose-100 border border-rose-50">
			<h2 class="text-lg font-semibold text-rose-900 mb-6 text-center">Masuk dengan Email & PIN</h2>

			<form onsubmit={handleLogin} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-rose-700 mb-2">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="nama@email.com"
						class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
						required
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="pin" class="block text-sm font-medium text-rose-700 mb-2">PIN</label>
					<input
						type="password"
						id="pin"
						bind:value={pin}
						placeholder="Masukkan PIN"
						class="w-full px-4 py-3 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-center text-lg tracking-widest"
						maxlength="6"
						required
						disabled={isLoading}
					/>
				</div>

				{#if error}
					<div class="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
						<AlertCircle size={16} />
						<span>{error}</span>
					</div>
				{/if}

				<button
					type="submit"
					disabled={isLoading || !email || !pin}
					class="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
				>
					{#if isLoading}
						<Loader2 size={20} class="animate-spin" />
						<span>Masuk...</span>
					{:else}
						<span>Masuk</span>
					{/if}
				</button>
			</form>

			<p class="text-center text-xs text-rose-400 mt-6">
				Gunakan email & PIN yang diberikan oleh admin
			</p>
		</div>

		<!-- Footer -->
		<p class="text-center text-xs text-rose-300 mt-8">
			© 2024 Bloomy Craft & Service
		</p>
	</div>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fdf2f8 100%);
	}
</style>
