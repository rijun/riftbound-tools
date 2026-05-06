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
            ondragend={() => (dragId = undefined)}
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
  .table-wrap {
    overflow-x: auto;
    background:
      linear-gradient(180deg, var(--rb-ink-1) 0%, var(--rb-ink) 100%);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-md);
    box-shadow: var(--rb-shadow-md);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--rb-fs-base);
  }

  /* Default cell — also used by CardRow via :global */
  th,
  :global(td) {
    padding: 0.55rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--rb-line);
  }

  /* Header row — chiseled feel */
  thead th {
    background: linear-gradient(180deg, var(--rb-ink-2) 0%, var(--rb-ink-1) 100%);
    position: sticky;
    top: 0;
    z-index: 2;
    font-family: var(--rb-font-display);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wide);
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum);
    border-bottom: 1px solid var(--rb-line-strong);
  }
  /* Inset hairline beneath header — gives that chiseled separation */
  thead::after { content: ''; }

  .card-col {
    min-width: 240px;
  }

  .deck-col {
    min-width: 120px;
    border-bottom: 2px solid var(--accent, var(--rb-line-strong));
    /* Subtle accent gradient on top of the header */
    box-shadow:
      inset 0 -3px 0 -1px var(--accent, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.02);
    cursor: grab;
  }
  .deck-col:active { cursor: grabbing; }

  .max-col {
    width: 70px;
    text-align: right;
    color: var(--rb-vellum-dim);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-sm);
  }

  .deck-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .deck-name {
    flex: 1;
    font-family: var(--rb-font-display);
    font-weight: 600;
    color: var(--rb-vellum);
    /* Tint the deck name slightly with its accent */
    text-shadow: 0 0 14px color-mix(in srgb, var(--accent, transparent) 30%, transparent);
  }

  .remove {
    background: transparent;
    color: var(--rb-vellum-faint);
    border: 1px solid transparent;
    width: 22px;
    height: 22px;
    line-height: 1;
    border-radius: var(--rb-radius-xs);
    cursor: pointer;
    font-size: 1.05em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color var(--rb-dur-fast) var(--rb-ease-out),
                background var(--rb-dur-fast) var(--rb-ease-out),
                border-color var(--rb-dur-fast) var(--rb-ease-out);
  }
  .remove:hover {
    color: var(--rb-blood);
    border-color: var(--rb-blood);
    background: rgba(214, 90, 71, 0.1);
  }

  .champion {
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    color: var(--rb-vellum-dim);
    margin-top: 0.25rem;
  }
  /* Tiny accent pip before champion */
  .champion::before {
    content: '◆';
    margin-right: 0.4em;
    color: var(--accent, var(--rb-gold));
    opacity: 0.85;
  }

  /* Section headers (Main / Sideboard) */
  .section-header td {
    background:
      linear-gradient(90deg,
        transparent 0,
        rgba(212, 176, 106, 0.06) 30%,
        rgba(212, 176, 106, 0.06) 70%,
        transparent 100%),
      var(--rb-ink-1);
    font-family: var(--rb-font-display);
    font-weight: 600;
    text-transform: uppercase;
    font-size: var(--rb-fs-sm);
    letter-spacing: var(--rb-tracking-widest);
    color: var(--rb-gold);
    padding: 0.6rem 0.8rem;
    position: relative;
  }
  /* Decorative diamond glyph at the start of each section header */
  .section-header td::before {
    content: '◇';
    margin-right: 0.6em;
    color: var(--rb-gold);
    opacity: 0.7;
  }

  /* Sideboard section — visually heavier divider, with double-rule */
  .section-header.sideboard td {
    border-top: 1px solid var(--rb-gold-deep);
    box-shadow: inset 0 3px 0 -1px var(--rb-line-strong),
                inset 0 4px 0 -1px var(--rb-ink),
                inset 0 6px 0 -1px var(--rb-gold-deep);
    margin-top: 4px;
    color: var(--rb-ember);
  }
  .section-header.sideboard td::before {
    content: '✦';
    color: var(--rb-ember);
  }

  @media (max-width: 768px) {
    table { font-size: var(--rb-fs-sm); }
    .card-col { min-width: 180px; }
    .deck-col { min-width: 96px; }
  }
</style>
