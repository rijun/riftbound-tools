<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  let { children } = $props();
  onMount(() => {
    cardStore.loadInitial();
  });
</script>

{@render children()}
