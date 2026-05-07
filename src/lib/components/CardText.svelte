<script lang="ts">
  import { tokenizeCardText } from './card-text-tokenize.ts';

  let { text }: { text: string } = $props();

  type SymbolInfo =
    | { kind: 'rune';    modifier: string; label: string; tooltip: string }
    | { kind: 'energy';  modifier: string; label: string; tooltip: string }
    | { kind: 'might';   label: string; tooltip: string }
    | { kind: 'exhaust'; label: string; tooltip: string }
    | { kind: 'unknown'; label: string; tooltip: string };

  function classify(name: string): SymbolInfo {
    if (name.startsWith('rb_rune_')) {
      const domain = name.slice('rb_rune_'.length);
      return { kind: 'rune', modifier: domain, label: domain[0].toUpperCase(), tooltip: `${domain[0].toUpperCase()}${domain.slice(1)} Rune` };
    }
    if (name.startsWith('rb_energy_')) {
      const n = name.slice('rb_energy_'.length);
      return { kind: 'energy', modifier: n, label: n, tooltip: `Energy ${n}` };
    }
    if (name === 'rb_might')   return { kind: 'might',   label: 'M', tooltip: 'Might' };
    if (name === 'rb_exhaust') return { kind: 'exhaust', label: '⤿', tooltip: 'Exhaust' };
    return { kind: 'unknown', label: name, tooltip: name };
  }

  const tokens = $derived(tokenizeCardText(text));
</script>

<span class="card-text">
  {#each tokens as t, i (i)}
    {#if t.kind === 'text'}
      <span class="text-run">{t.value}</span>
    {:else}
      {@const info = classify(t.name)}
      <span
        class="sym sym-{info.kind}"
        class:rune-body={info.kind === 'rune' && info.modifier === 'body'}
        class:rune-calm={info.kind === 'rune' && info.modifier === 'calm'}
        class:rune-chaos={info.kind === 'rune' && info.modifier === 'chaos'}
        class:rune-fury={info.kind === 'rune' && info.modifier === 'fury'}
        class:rune-mind={info.kind === 'rune' && info.modifier === 'mind'}
        class:rune-order={info.kind === 'rune' && info.modifier === 'order'}
        class:rune-rainbow={info.kind === 'rune' && info.modifier === 'rainbow'}
        title={info.tooltip}
        aria-label={info.tooltip}
      >{info.label}</span>
    {/if}
  {/each}
</span>

<style>
  .card-text {
    white-space: pre-wrap;
  }

  .sym {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4em;
    height: 1.4em;
    padding: 0 0.3em;
    margin: 0 0.05em;
    border-radius: 999px;
    font-size: 0.85em;
    font-weight: 700;
    line-height: 1;
    vertical-align: -0.15em;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);
    color: #fff;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    font-family: var(--rb-font-mono, ui-monospace, monospace);
  }

  /* Rune palette — uses canonical domain tokens from tokens.css */
  .rune-body    { background: var(--rb-domain-body,  #e2614f); }
  .rune-chaos   { background: var(--rb-domain-chaos, #b07ad7); }
  .rune-mind    { background: var(--rb-domain-mind,  #6da4ee); }
  .rune-calm    { background: var(--rb-domain-calm,  #5fc9d9); }
  .rune-order   { background: var(--rb-domain-order, #e6c279); color: #1a1409; text-shadow: none; }
  .rune-fury    { background: var(--rb-domain-fury,  #ee6aa1); }
  .rune-rainbow {
    background: linear-gradient(90deg,
      var(--rb-domain-body,  #e2614f),
      var(--rb-domain-order, #e6c279),
      var(--rb-domain-calm,  #5fc9d9),
      var(--rb-domain-mind,  #6da4ee),
      var(--rb-domain-chaos, #b07ad7),
      var(--rb-domain-fury,  #ee6aa1)
    );
  }

  /* Energy: neutral dark with cream text */
  .sym-energy {
    background: var(--rb-ink-2, #161a26);
    color: var(--rb-vellum, #efe7d2);
  }

  /* Might: gold-on-dark */
  .sym-might {
    background: var(--rb-gold, #d4b06a);
    color: #1a1409;
    text-shadow: none;
  }

  /* Exhaust: outline only */
  .sym-exhaust {
    background: transparent;
    border: 1px solid var(--rb-line-strong, #3a4256);
    color: var(--rb-vellum, #efe7d2);
    text-shadow: none;
    box-shadow: none;
  }

  /* Unknown placeholder — render dimly so we notice it */
  .sym-unknown {
    background: rgba(255, 255, 255, 0.08);
    color: var(--rb-vellum-dim, #8d8a7c);
    font-size: 0.75em;
    text-shadow: none;
  }
</style>
