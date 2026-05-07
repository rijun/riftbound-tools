<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { decksState } from '$lib/state/decks.svelte.ts';
  let { children } = $props();
  onMount(() => {
    cardStore.loadInitial();
    decksState.restore();
  });
</script>

{@render children()}
