<script lang="ts">
  import { decksState, type SortMode } from '$lib/state/decks.svelte.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'presence', label: 'Presence' },
    { value: 'alpha', label: 'A–Z' },
    { value: 'total', label: 'Total copies' }
  ];
</script>

<div class="toolbar">
  <input
    type="search"
    placeholder="Search cards…"
    bind:value={decksState.search}
    aria-label="Search cards"
  />
  <label>
    Sort
    <select bind:value={decksState.sort}>
      {#each sortOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </label>
  <label>
    Filter to deck
    <select bind:value={decksState.deckFilter}>
      <option value={undefined}>All decks</option>
      {#each decksState.decks as d (d.id)}
        <option value={d.id}>{d.name}</option>
      {/each}
    </select>
  </label>
  <button onclick={() => cardStore.refreshFromApi()} disabled={cardStore.refreshState.status === 'loading'}>
    {cardStore.refreshState.status === 'loading' ? 'Refreshing…' : 'Refresh card DB'}
  </button>
  {#if cardStore.refreshState.status === 'error'}
    <span class="error">{cardStore.refreshState.message}</span>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
  }
  input[type='search'] { flex: 1 1 200px; }
  .error { color: #c84d3b; font-size: 0.85em; }
</style>
