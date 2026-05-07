<script lang="ts">
  import { decksState, type SortMode } from '$lib/state/decks.svelte.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { buildComparison, downloadComparison, defaultFilename } from '$lib/state/comparison.ts';

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'presence', label: 'Presence' },
    { value: 'alpha', label: 'A–Z' },
    { value: 'total', label: 'Total copies' }
  ];

  function exportComparison() {
    const comparison = buildComparison(decksState.decks);
    downloadComparison(comparison, defaultFilename());
  }
</script>

<div class="toolbar">
  <input
    type="search"
    placeholder="Search the codex…"
    bind:value={decksState.search}
    aria-label="Search cards"
  />
  <label>
    <span class="label-text">Sort</span>
    <select bind:value={decksState.sort}>
      {#each sortOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </label>
  <label>
    <span class="label-text">Filter</span>
    <select bind:value={decksState.deckFilter}>
      <option value="">All decks</option>
      {#each decksState.decks as d (d.id)}
        <option value={d.id}>{d.name}</option>
      {/each}
    </select>
  </label>
  <button
    class="refresh"
    onclick={exportComparison}
    disabled={decksState.decks.length === 0}
    title={decksState.decks.length === 0 ? 'Add decks first' : 'Download the current comparison as JSON'}
  >
    Export comparison
  </button>
  <button class="refresh" onclick={() => cardStore.refreshFromApi()} disabled={cardStore.refreshState.status === 'loading'}>
    <span class="refresh-icon" aria-hidden="true" class:spinning={cardStore.refreshState.status === 'loading'}>↻</span>
    <span>{cardStore.refreshState.status === 'loading' ? 'Refreshing…' : 'Refresh card DB'}</span>
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
    gap: var(--rb-space-3);
    padding: var(--rb-space-3) var(--rb-space-4);
    margin-bottom: var(--rb-space-3);
    background: linear-gradient(180deg,
      var(--rb-ink-1) 0%,
      var(--rb-ink) 100%);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-md);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02), var(--rb-shadow-sm);
  }

  input[type='search'] {
    flex: 1 1 240px;
    min-width: 180px;
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: var(--rb-space-2);
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-mute);
  }
  .label-text {
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    color: var(--rb-vellum-dim);
  }

  select {
    background: var(--rb-ink-2);
    border: 1px solid var(--rb-line);
    color: var(--rb-vellum);
    padding: 0.4rem 0.7rem;
    border-radius: var(--rb-radius-sm);
    cursor: pointer;
    transition: border-color var(--rb-dur-fast) var(--rb-ease-out),
                box-shadow var(--rb-dur-fast) var(--rb-ease-out);
  }
  select:hover {
    border-color: var(--rb-gold-deep);
  }
  select:focus {
    outline: none;
    border-color: var(--rb-gold);
    box-shadow: 0 0 0 3px var(--rb-gold-glow);
  }

  .refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    padding: 0.45rem 0.9rem;
    background: linear-gradient(180deg, var(--rb-ink-2), var(--rb-ink-1));
    color: var(--rb-vellum);
    border: 1px solid var(--rb-line-strong);
    border-radius: var(--rb-radius-sm);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    transition: border-color var(--rb-dur-fast) var(--rb-ease-out),
                color var(--rb-dur-fast) var(--rb-ease-out),
                background var(--rb-dur-fast) var(--rb-ease-out),
                transform var(--rb-dur-fast) var(--rb-ease-out);
  }
  .refresh:hover:not(:disabled) {
    border-color: var(--rb-gold);
    color: var(--rb-gold);
    background: linear-gradient(180deg, var(--rb-ink-3), var(--rb-ink-2));
  }
  .refresh:active:not(:disabled) {
    transform: translateY(1px);
  }
  .refresh:disabled {
    opacity: 0.55;
    cursor: progress;
  }
  .refresh-icon {
    display: inline-block;
    line-height: 1;
    font-size: 1.05em;
  }
  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: var(--rb-blood);
    font-size: var(--rb-fs-sm);
    font-family: var(--rb-font-mono);
  }

  @media (max-width: 480px) {
    .toolbar { padding: var(--rb-space-3); }
    .refresh { margin-left: 0; }
    label { width: 100%; }
    label select { flex: 1; }
  }
</style>
