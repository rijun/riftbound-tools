<script lang="ts">
  import DeckUploader from '$lib/components/DeckUploader.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import MetaPanel from '$lib/components/MetaPanel.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import { decksState } from '$lib/state/decks.svelte.ts';
</script>

<main>
  <header>
    <h1>Riftbound Decklist Analyser</h1>
  </header>

  <DeckUploader />

  {#if decksState.decks.length > 0}
    <MetaPanel />
    <Toolbar />
    <ComparisonTable />
  {:else}
    <p class="empty">Drop deck files to begin.</p>
  {/if}

  <Toaster />
</main>

<style>
  main { max-width: 1400px; margin: 0 auto; padding: 1rem; }
  .empty { opacity: 0.6; padding: 2rem 0; }
</style>
