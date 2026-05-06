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
  tr { cursor: pointer; }
  tr:hover { background: rgba(255,255,255,0.02); }
  tr.core { background: rgba(255,255,255,0.025); }
  tr.expanded { background: rgba(255,255,255,0.05); }
  .dot { color: #c9a96b; margin-right: 0.35em; }
  .count { text-align: center; font-variant-numeric: tabular-nums; }
  .max { text-align: right; opacity: 0.7; }
  .detail-row td { background: #0f1116; padding: 1rem; }
</style>
