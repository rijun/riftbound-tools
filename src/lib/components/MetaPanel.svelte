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
  .meta {
    margin: var(--rb-space-5) 0 var(--rb-space-4);
  }

  .header {
    background: transparent;
    border: none;
    color: var(--rb-vellum-mute);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-widest);
    cursor: pointer;
    padding: var(--rb-space-2) 0;
    margin-bottom: var(--rb-space-3);
    transition: color var(--rb-dur-fast) var(--rb-ease-out);
  }
  .header:hover { color: var(--rb-gold); }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--rb-space-4);
  }

  .card {
    position: relative;
    border: 1px solid var(--rb-line);
    background:
      linear-gradient(180deg,
        color-mix(in srgb, var(--accent, transparent) 6%, var(--rb-ink-1)) 0%,
        var(--rb-ink-1) 60%,
        var(--rb-ink) 100%);
    padding: var(--rb-space-4);
    border-radius: var(--rb-radius-md);
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-mute);
    box-shadow: var(--rb-shadow-sm);
    transition: transform var(--rb-dur-base) var(--rb-ease-out),
                box-shadow var(--rb-dur-base) var(--rb-ease-out),
                border-color var(--rb-dur-base) var(--rb-ease-out);
    animation: meta-rise var(--rb-dur-slow) var(--rb-ease-out) both;
  }
  /* Stagger entry of meta cards */
  .card:nth-child(1) { animation-delay: 0ms; }
  .card:nth-child(2) { animation-delay: 60ms; }
  .card:nth-child(3) { animation-delay: 120ms; }
  .card:nth-child(4) { animation-delay: 180ms; }
  .card:nth-child(5) { animation-delay: 240ms; }
  .card:nth-child(n+6) { animation-delay: 300ms; }

  /* Top accent rule = the dominant rune-domain bar */
  .card::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    height: 3px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--accent, var(--rb-gold-deep)) 15%,
      var(--accent, var(--rb-gold)) 50%,
      var(--accent, var(--rb-gold-deep)) 85%,
      transparent 100%);
    border-radius: var(--rb-radius-md) var(--rb-radius-md) 0 0;
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent, transparent) 50%, transparent);
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--accent, var(--rb-line)) 40%, var(--rb-line));
    box-shadow: var(--rb-shadow-md);
  }

  h3 {
    margin: 0 0 var(--rb-space-3);
    font-family: var(--rb-font-display);
    font-weight: 600;
    font-size: var(--rb-fs-md);
    color: var(--rb-vellum);
    letter-spacing: var(--rb-tracking-wide);
    text-transform: uppercase;
    /* Light glow tinted to accent */
    text-shadow: 0 0 14px color-mix(in srgb, var(--accent, transparent) 35%, transparent);
  }

  .line {
    margin: var(--rb-space-1) 0;
    color: var(--rb-vellum);
  }
  .label {
    color: var(--rb-vellum-dim);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    margin-right: 0.4em;
  }

  ul {
    margin: var(--rb-space-1) 0 var(--rb-space-2) 0;
    padding-left: var(--rb-space-4);
    list-style: none;
  }
  ul li {
    position: relative;
    padding: 1px 0;
    color: var(--rb-vellum);
    font-variant-numeric: tabular-nums;
  }
  ul li::before {
    content: '·';
    position: absolute;
    left: -0.85em;
    color: var(--accent, var(--rb-gold));
    font-weight: 700;
    opacity: 0.85;
  }

  .totals {
    margin-top: var(--rb-space-3);
    padding-top: var(--rb-space-2);
    border-top: 1px dashed var(--rb-line);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    color: var(--rb-vellum-dim);
  }

  details {
    margin-top: var(--rb-space-2);
    color: var(--rb-ember);
  }
  details summary {
    cursor: pointer;
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    color: var(--rb-ember);
  }
  .warnings {
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-mute);
    margin-top: var(--rb-space-1);
  }

  @keyframes meta-rise {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
