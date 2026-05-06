<script lang="ts">
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { deckAccent } from '$lib/theme/domains.ts';

  let collapsed = $state(false);

  function totalCount(entries: Array<{ count: number }>): number {
    return entries.reduce((s, e) => s + e.count, 0);
  }
</script>

<section class="meta">
  <button class="header" onclick={() => (collapsed = !collapsed)}>
    {collapsed ? '▸' : '▾'} Deck details
  </button>
  {#if !collapsed}
    <div class="grid">
      {#each decksState.decks as d (d.id)}
        <article class="card" style="--accent: {deckAccent(d)}">
          <h3>{d.name}</h3>
          {#if d.zones.legend[0]}
            <p class="line"><span class="label">Legend:</span> {d.zones.legend[0].cardName}</p>
          {/if}
          {#if d.zones.battlefields.length > 0}
            <p class="line"><span class="label">Battlefields:</span></p>
            <ul>
              {#each d.zones.battlefields as e}
                <li>{e.count} {e.cardName}</li>
              {/each}
            </ul>
          {/if}
          {#if d.zones.runes.length > 0}
            <p class="line"><span class="label">Runes:</span></p>
            <ul>
              {#each d.zones.runes as e}
                <li>{e.count} {e.cardName}</li>
              {/each}
            </ul>
          {/if}
          <p class="totals">
            Main: {totalCount(d.zones.main)} · Sideboard: {totalCount(d.zones.sideboard)}
          </p>
          {#if d.warnings.length > 0}
            <details>
              <summary>{d.warnings.length} warning{d.warnings.length === 1 ? '' : 's'}</summary>
              <ul class="warnings">
                {#each d.warnings as w}<li>{w}</li>{/each}
              </ul>
            </details>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .meta { margin: 1rem 0; }
  .header {
    background: transparent; border: none; color: inherit;
    font: inherit; cursor: pointer; padding: 0.5rem 0; opacity: 0.85;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
  .card {
    border: 1px solid #2a2d35; border-top: 3px solid var(--accent, #555);
    background: #14161c; padding: 0.75rem; border-radius: 6px;
    font-size: 0.9em;
  }
  h3 { margin: 0 0 0.5rem; font-size: 1em; }
  .label { opacity: 0.6; font-size: 0.85em; }
  ul { margin: 0.25rem 0 0.5rem 1rem; padding: 0; }
  .totals { margin-top: 0.5rem; opacity: 0.85; }
  .warnings { font-size: 0.85em; opacity: 0.8; }
</style>
