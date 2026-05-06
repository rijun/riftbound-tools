<script lang="ts">
  import type { TableRow } from '$lib/state/derivation.ts';
  import CardDetail from './CardDetail.svelte';

  let { row, accents, expanded, onToggle }: {
    row: TableRow;
    accents: string[];
    expanded: boolean;
    onToggle: () => void;
  } = $props();

  function bg(count: number, accent: string): string {
    if (count <= 0) return 'transparent';
    const opacity = Math.min(1, count / 3);
    return `color-mix(in srgb, ${accent} ${Math.round(opacity * 100)}%, transparent)`;
  }
</script>

<tr class:core={row.isCore} class:expanded onclick={onToggle}>
  <td class="card-name">
    {#if row.isCore}<span class="dot" aria-hidden="true">●</span>{/if}
    {row.cardName}
  </td>
  {#each row.countsPerDeck as count, i}
    <td class="count" style="background: {bg(count, accents[i])}">
      {count > 0 ? count : '—'}
    </td>
  {/each}
  <td class="max">{row.maxInRow}</td>
</tr>
{#if expanded}
  <tr class="detail-row">
    <td colspan={row.countsPerDeck.length + 2}>
      <CardDetail cardName={row.cardName} cardId={row.cardId} />
    </td>
  </tr>
{/if}

<style>
  tr {
    cursor: pointer;
    transition: background-color var(--rb-dur-fast) var(--rb-ease-out);
  }
  tr:hover {
    background: rgba(212, 176, 106, 0.04);
  }

  /* Core rows = cards in every deck. Subtle parchment glow + gold band */
  tr.core {
    background: linear-gradient(90deg,
      rgba(212, 176, 106, 0.08) 0%,
      rgba(212, 176, 106, 0.03) 35%,
      rgba(212, 176, 106, 0.03) 65%,
      rgba(212, 176, 106, 0.08) 100%);
    box-shadow: inset 2px 0 0 var(--rb-gold), inset -2px 0 0 var(--rb-gold-deep);
  }
  tr.core:hover {
    background: linear-gradient(90deg,
      rgba(212, 176, 106, 0.13) 0%,
      rgba(212, 176, 106, 0.06) 35%,
      rgba(212, 176, 106, 0.06) 65%,
      rgba(212, 176, 106, 0.13) 100%);
  }

  tr.expanded {
    background: rgba(111, 124, 255, 0.08);
  }
  tr.expanded:hover {
    background: rgba(111, 124, 255, 0.12);
  }

  .card-name {
    color: var(--rb-vellum);
    font-weight: 400;
  }
  tr.core .card-name {
    color: var(--rb-gold);
    font-weight: 500;
  }

  .dot {
    color: var(--rb-gold);
    margin-right: 0.45em;
    text-shadow: 0 0 6px var(--rb-gold-glow);
    font-size: 0.7em;
    vertical-align: middle;
  }

  .count {
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-family: var(--rb-font-mono);
    font-weight: 500;
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum);
    /* Inner border-like ring for tinted cells; the inline bg handles the fill */
    transition: filter var(--rb-dur-fast) var(--rb-ease-out);
    position: relative;
  }
  .count:not([style*='transparent']):not([style*='rgba(0, 0, 0, 0)']) {
    /* deeper text contrast against the colored fill */
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
    color: var(--rb-vellum);
  }
  /* Empty count cells get a soft em-dash that doesn't shout */
  .count:empty,
  .count[style*='transparent'] {
    color: var(--rb-vellum-faint);
  }

  .max {
    text-align: right;
    color: var(--rb-vellum-dim);
    font-family: var(--rb-font-mono);
    font-variant-numeric: tabular-nums;
    font-size: var(--rb-fs-sm);
  }

  .detail-row td {
    background:
      linear-gradient(180deg,
        rgba(111, 124, 255, 0.04) 0%,
        transparent 100%),
      var(--rb-void);
    padding: var(--rb-space-5);
    border-bottom: 1px solid var(--rb-line);
    box-shadow: inset 0 1px 0 var(--rb-line-strong);
    animation: detail-in var(--rb-dur-base) var(--rb-ease-out) both;
  }
  @keyframes detail-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
</style>
