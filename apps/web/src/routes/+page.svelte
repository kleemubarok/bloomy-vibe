<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated } from '$lib/api/client';

    // No visual UI needed – we redirect immediately.
    onMount(() => {
        if (isAuthenticated()) {
            goto('/dashboard');
        } else {
            goto('/login');
        }
    });
</script>

{#if false}
    <!-- placeholder kept for SvelteKit to avoid empty file warnings -->
    <p>Redirecting…</p>
{/if}
