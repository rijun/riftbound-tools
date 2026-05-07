<script lang="ts">
  import { parseDeckCode } from '$lib/parser/deck-code-parser.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { addToast } from './toaster-store.svelte.ts';

  let code = $state('');
  let name = $state('');
  let pastedCounter = $state(1);

  function add() {
    if (!cardStore.resolver) {
      addToast({ kind: 'error', message: 'Card database not loaded yet.' });
      return;
    }
    const trimmed = code.trim();
    if (!trimmed) {
      addToast({ kind: 'error', message: 'Paste a deck code first.' });
      return;
    }
    const deckName = name.trim() || `Pasted deck ${pastedCounter}`;
    try {
      const deck = parseDeckCode(trimmed, deckName, cardStore.resolver);
      decksState.add(deck);
      code = '';
      name = '';
      pastedCounter += 1;
    } catch (e) {
      addToast({ kind: 'error', message: (e as Error).message });
    }
  }
</script>

<section class="panel">
  <h2>Or paste a deck code</h2>
  <div class="row">
    <input
      type="text"
      placeholder="Deck name (optional)"
      bind:value={name}
      class="name-input"
    />
    <button onclick={add}>Add deck</button>
  </div>
  <textarea
    placeholder="Paste a Riftbound deck code here…"
    bind:value={code}
    rows="3"
    spellcheck="false"
  ></textarea>
</section>

<style>
  .panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-lg, 8px);
    background: var(--rb-ink-1);
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: var(--rb-fs-sm);
    font-weight: 500;
    color: var(--rb-vellum-dim);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wide, 0.05em);
    font-family: var(--rb-font-body);
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .name-input { flex: 1; }
  textarea {
    width: 100%;
    font-family: var(--rb-font-mono);
    font-size: 0.85em;
    resize: vertical;
    background: var(--rb-void);
    color: var(--rb-vellum);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-sm, 4px);
    padding: 0.4rem 0.6rem;
  }
  textarea:focus {
    outline: none;
    border-color: var(--rb-gold);
    box-shadow: 0 0 0 3px var(--rb-gold-glow);
  }
  textarea::placeholder {
    color: var(--rb-vellum-faint);
    font-style: italic;
  }
  button {
    cursor: pointer;
    background: var(--rb-gold-deep);
    color: #fff;
    border: none;
    border-radius: var(--rb-radius-sm, 4px);
    padding: 0.4rem 0.8rem;
    font: inherit;
    font-weight: 600;
    white-space: nowrap;
    transition: background var(--rb-dur-fast, 120ms) var(--rb-ease-out, ease-out);
  }
  button:hover { background: var(--rb-gold); color: var(--rb-ink); }
</style>
