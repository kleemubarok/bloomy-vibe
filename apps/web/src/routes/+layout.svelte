<script lang="ts">
	import '../app.css';
	import { appState } from '$lib/stores/app.svelte';
	import { Home, ShoppingCart, Package, History, User, WifiOff, Bell } from 'lucide-svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();

	const navItems = [
		{ name: 'Dashboard', icon: Home, href: '/dashboard' },
		{ name: 'POS', icon: ShoppingCart, href: '/pos' },
		{ name: 'Inventory', icon: Package, href: '/inventory' },
		{ name: 'Riwayat', icon: History, href: '/audit' }
	];

	// Handle PWA reload/refresh logic if needed
</script>

<svelte:head>
	<title>Bloomy POS</title>
</svelte:head>

<!-- Offline Indicator -->
{#if !appState.isOnline}
	<div class="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white text-xs py-1 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
		<WifiOff size={14} />
		Offline Mode - Data akan disinkronisasi saat kembali online
	</div>
{/if}

<div class="flex flex-col min-h-screen relative pb-20 md:pb-0 md:pl-64">
	<!-- Top Bar (Desktop & Mobile) -->
	<header class="sticky top-0 z-40 w-full glass px-4 py-3 flex items-center justify-between border-b border-rose-100">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200">
				<span class="text-white font-bold text-lg">B</span>
			</div>
			<h1 class="font-bold text-rose-900 tracking-tight hidden sm:block">Bloomy Craft</h1>
		</div>

		<div class="flex items-center gap-3">
			<button class="p-2 rounded-full text-rose-400 hover:bg-rose-50 transition-colors relative">
				<Bell size={20} />
				<span class="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full border border-white"></span>
			</button>
			<div class="flex items-center gap-2 pl-2 border-l border-rose-100">
				<div class="hidden sm:block text-right">
					<p class="text-xs font-medium text-rose-900 leading-none">Mbak Xioma</p>
					<p class="text-[10px] text-rose-400">Owner</p>
				</div>
				<div class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 border border-rose-200 overflow-hidden">
					<User size={18} />
				</div>
			</div>
		</div>
	</header>

	<!-- Desktop Sidebar -->
	<aside class="fixed left-0 top-0 bottom-0 w-64 glass border-r border-rose-100 hidden md:flex flex-col p-4 z-50">
		<div class="flex items-center gap-2 mb-8 px-2">
			<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200">
				<span class="text-white font-bold text-xl">B</span>
			</div>
			<div>
				<h2 class="font-bold text-rose-950 leading-none">Bloomy</h2>
				<p class="text-[10px] text-rose-400 font-medium uppercase tracking-wider">Craft & Service</p>
			</div>
		</div>

		<nav class="flex-1 space-y-1">
			{#each navItems as item}
				{@const active = page.url.pathname.startsWith(item.href)}
				<a 
					href={item.href}
					class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
						{active ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 font-semibold' : 'text-rose-400 hover:bg-rose-50 hover:text-rose-600'}"
				>
					<item.icon size={20} class={active ? '' : 'group-hover:scale-110 transition-transform'} />
					<span>{item.name}</span>
				</a>
			{/each}
		</nav>

		<div class="mt-auto p-4 bg-rose-50 rounded-2xl border border-rose-100">
			<div class="flex items-center gap-3 mb-2">
				<div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-500 shadow-sm">
					<WifiOff size={16} />
				</div>
				<span class="text-xs font-semibold text-rose-900">Offline Ready</span>
			</div>
			<p class="text-[10px] text-rose-400 leading-tight">Aplikasi ini berjalan secara lokal & akan sinkron saat online.</p>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 p-4 md:p-8 animate-in fade-in duration-500">
		{@render children()}
	</main>

	<!-- Mobile Bottom Nav -->
	<nav class="fixed bottom-0 left-0 right-0 h-16 glass border-t border-rose-100 md:hidden flex items-center justify-around px-2 z-50">
		{#each navItems as item}
			{@const active = page.url.pathname.startsWith(item.href)}
			<a 
				href={item.href}
				class="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all
					{active ? 'text-rose-600' : 'text-rose-300'}"
			>
				<item.icon size={20} class={active ? 'scale-110' : ''} />
				<span class="text-[10px] font-medium">{item.name}</span>
				{#if active}
					<div class="absolute bottom-1 w-1 h-1 bg-rose-600 rounded-full"></div>
				{/if}
			</a>
		{/each}
		<a 
			href="/profile"
			class="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl text-rose-300"
		>
			<User size={20} />
			<span class="text-[10px] font-medium">Profil</span>
		</a>
	</nav>
</div>

<style>
	:global(body) {
		background-attachment: fixed;
	}
</style>
