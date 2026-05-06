<script lang="ts">
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { deriveRows } from '$lib/state/derivation.ts';
  import { deckAccent } from '$lib/theme/domains.ts';
  import CardRow from './CardRow.svelte';

  const derived = $derived(
    deriveRows(decksState.decks, {
      search: decksState.search,
      sort: decksState.sort,
      deckFilter: decksState.deckFilter
    })
  );

  let expandedKey = $state<string | undefined>(undefined);

  function rowKey(section: 'main' | 'side', cardName: string): string {
    return `${section}:${cardName}`;
  }

  function toggle(key: string) {
    expandedKey = expandedKey === key ? undefined : key;
  }

  let dragId = $state<string | undefined>(undefined);

  function onDragStart(id: string) { dragId = id; }
  function onDrop(e: DragEvent, targetIdx: number) {
    e.preventDefault();
    if (dragId) decksState.move(dragId, targetIdx);
    dragId = undefined;
  }
  function onDragOver(e: DragEvent) { e.preventDefault(); }
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th class="card-col">Card</th>
        {#each decksState.decks as deck, i (deck.id)}
          <th
            class="deck-col"
            style="--accent: {deckAccent(deck)}"
            draggable="true"
            ondragstart={() => onDragStart(deck.id)}
            ondragover={onDragOver}
            ondrop={(e) => onDrop(e, i)}
          >
            <div class="deck-head">
              <span class="deck-name">{deck.name}</span>
              <button class="remove" onclick={() => decksState.remove(deck.id)} aria-label="Remove deck">×</button>
            </div>
            {#if deck.zones.champion[0]}
              <div class="champion">{deck.zones.champion[0].cardName}</div>
            {/if}
          </th>
        {/each}
        <th class="max-col">Max</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-header"><td colspan={decksState.decks.length + 2}>Main Deck</td></tr>
      {#each derived.mainRows as row (row.cardName)}
        <CardRow
          {row}
          accents={decksState.decks.map((d) => deckAccent(d))}
          expanded={expandedKey === rowKey('main', row.cardName)}
          onToggle={() => toggle(rowKey('main', row.cardName))}
        />
      {/each}

      {#if derived.sideRows.length > 0}
        <tr class="section-header sideboard"><td colspan={decksState.decks.length + 2}>Sideboard</td></tr>
        {#each derived.sideRows as row (row.cardName)}
          <CardRow
            {row}
            accents={decksState.decks.map((d) => deckAccent(d))}
            expanded={expandedKey === rowKey('side', row.cardName)}
            onToggle={() => toggle(rowKey('side', row.cardName))}
          />
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
  th, :global(td) { padding: 0.4rem 0.6rem; text-align: left; border-bottom: 1px solid #1f2128; }
  th { background: #14161c; position: sticky; top: 0; }
  .card-col { min-width: 220px; }
  .deck-col { min-width: 110px; border-bottom: 2px solid var(--accent, #555); }
  .max-col { width: 60px; text-align: right; }
  .deck-head { display: flex; align-items: center; gap: 0.5rem; }
  .deck-name { flex: 1; }
  .remove { background: transparent; color: #888; border: none; cursor: pointer; font-size: 1.1em; }
  .remove:hover { color: #fff; }
  .champion { font-size: 0.8em; opacity: 0.75; margin-top: 0.15rem; }
  .section-header td {
    background: #11131a;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75em;
    letter-spacing: 0.06em;
    padding: 0.5rem 0.6rem;
  }
  .section-header.sideboard td { border-top: 3px solid #2a2d35; }
</style>
