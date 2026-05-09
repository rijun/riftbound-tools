<script lang="ts">
  import { parsePaste } from '$lib/parser/paste-formats.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { addToast } from './toaster-store.svelte.ts';

  let input = $state('');
  let name = $state('');
  let pastedCounter = $state(1);

  function add() {
    if (!cardStore.resolver) {
      addToast({ kind: 'error', message: 'Card database not loaded yet.' });
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      addToast({ kind: 'error', message: 'Paste a deck code or decklist first.' });
      return;
    }
    const deckName = name.trim() || `Pasted deck ${pastedCounter}`;
    try {
      const deck = parsePaste(trimmed, deckName, cardStore.resolver);
      decksState.add(deck);
      input = '';
      name = '';
      pastedCounter += 1;
    } catch (e) {
      addToast({ kind: 'error', message: (e as Error).message });
    }
  }
</script>

<section class="panel">
  <h2 class="section-head">
    <span class="section-mark" aria-hidden="true">◇</span>
    <span class="section-text">Or paste a deck</span>
    <span class="section-mark" aria-hidden="true">◇</span>
  </h2>

  <div class="row">
    <input
      type="text"
      placeholder="Deck name (optional)"
      bind:value={name}
      class="name-input"
      aria-label="Deck name"
    />
    <button class="add-btn" onclick={add}>Add deck</button>
  </div>
  <textarea
    placeholder="Paste a Riftbound deck code or decklist text…"
    bind:value={input}
    rows="3"
    spellcheck="false"
    aria-label="Deck code or decklist"
  ></textarea>
</section>

<style>
  .panel {
    position: relative;
    padding: var(--rb-space-4) var(--rb-space-4) var(--rb-space-4);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-md);
    background:
      linear-gradient(180deg,
        rgba(212, 176, 106, 0.025) 0%,
        transparent 40%),
      var(--rb-ink-1);
    box-shadow: var(--rb-shadow-sm);
  }

  /* ----- Section header with flanking flourishes ----- */
  .section-head {
    display: flex;
    align-items: center;
    gap: var(--rb-space-3);
    margin: 0 0 var(--rb-space-3);
    color: var(--rb-vellum-mute);
    font-family: var(--rb-font-display);
    font-weight: 500;
    font-size: var(--rb-fs-sm);
    letter-spacing: var(--rb-tracking-wider);
    text-transform: uppercase;
  }
  .section-head::before,
  .section-head::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right,
      transparent,
      var(--rb-line-strong) 30%,
      var(--rb-line-strong) 70%,
      transparent);
    opacity: 0.6;
  }
  .section-head::before {
    background: linear-gradient(to right, transparent, var(--rb-line-strong) 70%);
  }
  .section-head::after {
    background: linear-gradient(to left, transparent, var(--rb-line-strong) 70%);
  }
  .section-mark {
    color: var(--rb-gold);
    font-size: 0.85em;
    line-height: 1;
    transform: translateY(-1px);
    opacity: 0.8;
  }
  .section-text { white-space: nowrap; }

  /* ----- Row layout ----- */
  .row {
    display: flex;
    gap: var(--rb-space-2);
    margin-bottom: var(--rb-space-2);
  }
  .name-input { flex: 1; min-width: 0; }

  /* ----- Inputs (shared rune-table treatment) ----- */
  input[type='text'],
  textarea {
    background: var(--rb-void);
    color: var(--rb-vellum);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-sm);
    padding: 0.45rem 0.7rem;
    font-family: var(--rb-font-body);
    font-size: var(--rb-fs-sm);
    transition: border-color var(--rb-dur-fast) var(--rb-ease-out),
                box-shadow var(--rb-dur-fast) var(--rb-ease-out),
                background var(--rb-dur-fast) var(--rb-ease-out);
  }
  textarea {
    width: 100%;
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    line-height: var(--rb-lh-snug);
    letter-spacing: 0.02em;
    resize: vertical;
    min-height: 4.4em;
  }
  input[type='text']:hover,
  textarea:hover {
    border-color: var(--rb-line-strong);
  }
  input[type='text']:focus,
  textarea:focus {
    outline: none;
    border-color: var(--rb-gold);
    background: var(--rb-ink);
    box-shadow: 0 0 0 3px var(--rb-gold-glow);
  }
  input[type='text']::placeholder,
  textarea::placeholder {
    color: var(--rb-vellum-faint);
    font-style: italic;
  }
  textarea::placeholder {
    font-family: var(--rb-font-mono);
    font-style: italic;
    letter-spacing: 0.02em;
  }

  /* ----- Add button — gold primary action with refined treatment ----- */
  .add-btn {
    cursor: pointer;
    background: linear-gradient(180deg, var(--rb-gold) 0%, var(--rb-gold-deep) 100%);
    color: #1a1409;
    border: 1px solid var(--rb-gold-deep);
    border-radius: var(--rb-radius-sm);
    padding: 0.45rem 1.1rem;
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25),
                0 1px 2px rgba(0, 0, 0, 0.4);
    transition: transform var(--rb-dur-fast) var(--rb-ease-out),
                box-shadow var(--rb-dur-fast) var(--rb-ease-out),
                background var(--rb-dur-fast) var(--rb-ease-out),
                filter var(--rb-dur-fast) var(--rb-ease-out);
  }
  .add-btn:hover {
    background: linear-gradient(180deg, #e6c179 0%, var(--rb-gold) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35),
                0 4px 14px var(--rb-gold-glow);
    filter: brightness(1.04);
  }
  .add-btn:active {
    transform: translateY(1px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 1px 2px rgba(0, 0, 0, 0.5);
  }
</style>
