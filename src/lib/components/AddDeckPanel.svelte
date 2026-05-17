<script lang="ts">
  import { parseFile } from '$lib/parser/index.ts';
  import { parsePaste } from '$lib/parser/paste-formats.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { addToast } from './toaster-store.svelte.ts';

  let dragging = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();

  let pasteInput = $state('');
  let pasteName = $state('');
  let pastedCounter = $state(1);

  async function handleFiles(files: FileList | File[]) {
    if (!cardStore.resolver) {
      addToast({ kind: 'error', message: 'Card database not loaded yet.' });
      return;
    }
    for (const file of Array.from(files)) {
      const result = await parseFile(file, cardStore.resolver);
      if (result.ok) {
        decksState.add(result.deck);
      } else {
        addToast({ kind: 'error', message: `${result.filename}: ${result.error}` });
      }
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  }
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }
  function onDragLeave() {
    dragging = false;
  }
  function onPick() {
    inputEl?.click();
  }
  function onChange(e: Event) {
    const f = (e.target as HTMLInputElement).files;
    if (f) handleFiles(f);
  }

  function addFromPaste() {
    if (!cardStore.resolver) {
      addToast({ kind: 'error', message: 'Card database not loaded yet.' });
      return;
    }
    const trimmed = pasteInput.trim();
    if (!trimmed) {
      addToast({ kind: 'error', message: 'Paste a deck code or decklist first.' });
      return;
    }
    const deckName = pasteName.trim() || `Pasted deck ${pastedCounter}`;
    try {
      const deck = parsePaste(trimmed, deckName, cardStore.resolver);
      decksState.add(deck);
      pasteInput = '';
      pasteName = '';
      pastedCounter += 1;
    } catch (e) {
      addToast({ kind: 'error', message: (e as Error).message });
    }
  }
</script>

<section class="panel">
  <textarea
    placeholder="Paste a Riftbound deck code or decklist text…"
    bind:value={pasteInput}
    rows="3"
    spellcheck="false"
    aria-label="Deck code or decklist"
  ></textarea>
  <div class="row">
    <input
      type="text"
      placeholder="Deck name (optional)"
      bind:value={pasteName}
      class="name-input"
      aria-label="Deck name"
    />
    <button class="add-btn" onclick={addFromPaste}>Add deck</button>
  </div>
  <p class="format-note">Supports Piltover Archive deck codes and decklist text.</p>

  <div class="seam" aria-hidden="true">
    <span class="seam-mark">◇</span>
    <span class="seam-text">or drop files</span>
    <span class="seam-mark">◇</span>
  </div>

  <div
    class="dropzone"
    class:dragging
    ondrop={onDrop}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    role="button"
    tabindex="0"
    onclick={onPick}
    onkeydown={(e) => e.key === 'Enter' && onPick()}
  >
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
    <span class="rune" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 4 L26 26 L6 26 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
        <path d="M16 12 L18 20 L14 20 Z" fill="currentColor" opacity="0.6"/>
      </svg>
    </span>
    <span class="dropzone-text">Drop <code>.txt</code> deck files &mdash; or click to browse</span>
    <input
      bind:this={inputEl}
      type="file"
      multiple
      accept=".txt,text/plain"
      onchange={onChange}
      hidden
    />
  </div>
</section>

<style>
  .panel {
    position: relative;
    padding: var(--rb-space-4);
    border: 1px solid var(--rb-line);
    border-radius: var(--rb-radius-md);
    background:
      linear-gradient(180deg,
        rgba(212, 176, 106, 0.025) 0%,
        transparent 40%),
      var(--rb-ink-1);
    box-shadow: var(--rb-shadow-sm);
  }

  /* ===== Dropzone (slim secondary affordance) ===== */
  .dropzone {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--rb-space-3);
    border: 1px dashed var(--rb-line-strong);
    padding: var(--rb-space-3) var(--rb-space-4);
    border-radius: var(--rb-radius-md);
    cursor: pointer;
    background:
      radial-gradient(ellipse 60% 70% at 50% 30%,
        rgba(111, 124, 255, 0.06),
        transparent 70%),
      var(--rb-ink-1);
    color: var(--rb-vellum-mute);
    transition: border-color var(--rb-dur-base) var(--rb-ease-out),
                background var(--rb-dur-base) var(--rb-ease-out),
                color var(--rb-dur-base) var(--rb-ease-out),
                transform var(--rb-dur-fast) var(--rb-ease-out),
                box-shadow var(--rb-dur-base) var(--rb-ease-out);
  }
  .dropzone:hover {
    border-color: var(--rb-gold-deep);
    color: var(--rb-vellum);
    box-shadow: var(--rb-shadow-md);
  }
  .dropzone:active { transform: translateY(1px); }
  .dropzone.dragging {
    border-color: var(--rb-gold);
    border-style: solid;
    color: var(--rb-vellum);
    background:
      radial-gradient(ellipse 70% 80% at 50% 30%,
        rgba(212, 176, 106, 0.18),
        transparent 70%),
      var(--rb-ink-2);
    box-shadow: var(--rb-shadow-glow-gold);
    animation: pulse-rift 1.4s var(--rb-ease-in-out) infinite;
  }

  /* Decorative corners — codex frame */
  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border: 1px solid var(--rb-gold-deep);
    opacity: 0.65;
    transition: opacity var(--rb-dur-base) var(--rb-ease-out),
                border-color var(--rb-dur-base) var(--rb-ease-out);
  }
  .corner.tl { top: 6px; left: 6px;  border-right: none; border-bottom: none; }
  .corner.tr { top: 6px; right: 6px; border-left: none;  border-bottom: none; }
  .corner.bl { bottom: 6px; left: 6px;  border-right: none; border-top: none; }
  .corner.br { bottom: 6px; right: 6px; border-left: none;  border-top: none; }
  .dropzone:hover .corner,
  .dropzone.dragging .corner { opacity: 1; border-color: var(--rb-gold); }

  .rune {
    display: inline-flex;
    width: 22px;
    height: 22px;
    color: var(--rb-gold);
    transition: transform var(--rb-dur-base) var(--rb-ease-out),
                filter var(--rb-dur-base) var(--rb-ease-out);
  }
  .dropzone:hover .rune,
  .dropzone.dragging .rune {
    transform: translateY(-1px) scale(1.05);
    filter: drop-shadow(0 0 10px var(--rb-gold-glow));
  }
  .rune svg { width: 100%; height: 100%; }

  .dropzone-text {
    font-family: var(--rb-font-body);
    font-size: var(--rb-fs-sm);
    color: inherit;
    font-style: italic;
  }
  .dropzone-text code {
    font-family: var(--rb-font-mono);
    font-style: normal;
    font-size: 0.92em;
    color: var(--rb-vellum-mute);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--rb-line);
    padding: 0.05em 0.4em;
    border-radius: var(--rb-radius-xs);
  }

  /* ===== "or drop files" seam ===== */
  .seam {
    display: flex;
    align-items: center;
    gap: var(--rb-space-3);
    margin: var(--rb-space-3) 0;
    color: var(--rb-vellum-mute);
    font-family: var(--rb-font-display);
    font-weight: 500;
    font-size: var(--rb-fs-sm);
    letter-spacing: var(--rb-tracking-wider);
    text-transform: uppercase;
  }
  .seam::before {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--rb-line-strong) 70%);
    opacity: 0.6;
  }
  .seam::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to left, transparent, var(--rb-line-strong) 70%);
    opacity: 0.6;
  }
  .seam-mark {
    color: var(--rb-gold);
    font-size: 0.85em;
    line-height: 1;
    transform: translateY(-1px);
    opacity: 0.8;
  }
  .seam-text { white-space: nowrap; }

  /* ===== Name + button row ===== */
  .row {
    display: flex;
    gap: var(--rb-space-2);
    margin-top: var(--rb-space-2);
  }
  .name-input { flex: 1; min-width: 0; }

  /* ===== Format note ===== */
  .format-note {
    margin: var(--rb-space-2) 0 0;
    font-size: var(--rb-fs-xs);
    color: var(--rb-vellum-faint);
    font-style: italic;
    text-align: center;
  }

  /* ===== Inputs ===== */
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

  /* ===== Gold "Add deck" button ===== */
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

  @keyframes pulse-rift {
    0%, 100% { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.35),
                            0 8px 26px rgba(212, 176, 106, 0.18); }
    50%      { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.55),
                            0 14px 38px rgba(212, 176, 106, 0.32); }
  }
</style>
