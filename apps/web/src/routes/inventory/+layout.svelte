<script lang="ts">
	let { children } = $props();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-rose-900">Inventory</h1>
			<p class="text-sm text-rose-400">Kelola bahan & produk</p>
		</div>
	</div>
	{@render children()}
</div>