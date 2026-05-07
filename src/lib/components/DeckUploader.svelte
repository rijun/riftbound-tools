<script lang="ts">
  import { parseFile } from '$lib/parser/index.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { addToast } from './toaster-store.svelte.ts';

  let dragging = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();

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
</script>

<div
  class="uploader"
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
  <p class="uploader-title">Drop your decklists here</p>
  <p class="uploader-sub">Drop .txt deck files &mdash; or click to summon the file picker</p>
  <input
    bind:this={inputEl}
    type="file"
    multiple
    accept=".txt,text/plain"
    onchange={onChange}
    hidden
  />
</div>

<style>
  .uploader {
    position: relative;
    border: 1px dashed var(--rb-line-strong);
    padding: var(--rb-space-6) var(--rb-space-5);
    border-radius: var(--rb-radius-lg);
    cursor: pointer;
    text-align: center;
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
  .uploader:hover {
    border-color: var(--rb-gold-deep);
    color: var(--rb-vellum);
    box-shadow: var(--rb-shadow-md);
  }
  .uploader:active { transform: translateY(1px); }
  .uploader.dragging {
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

  /* Decorative corners — like an old codex frame */
  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border: 1px solid var(--rb-gold-deep);
    opacity: 0.65;
    transition: opacity var(--rb-dur-base) var(--rb-ease-out),
                border-color var(--rb-dur-base) var(--rb-ease-out);
  }
  .corner.tl { top: 8px; left: 8px;  border-right: none; border-bottom: none; }
  .corner.tr { top: 8px; right: 8px; border-left: none;  border-bottom: none; }
  .corner.bl { bottom: 8px; left: 8px;  border-right: none; border-top: none; }
  .corner.br { bottom: 8px; right: 8px; border-left: none;  border-top: none; }
  .uploader:hover .corner,
  .uploader.dragging .corner { opacity: 1; border-color: var(--rb-gold); }

  .rune {
    display: inline-block;
    width: 30px;
    height: 30px;
    color: var(--rb-gold);
    margin-bottom: var(--rb-space-3);
    transition: transform var(--rb-dur-base) var(--rb-ease-out),
                filter var(--rb-dur-base) var(--rb-ease-out);
  }
  .uploader:hover .rune,
  .uploader.dragging .rune {
    transform: translateY(-2px) scale(1.05);
    filter: drop-shadow(0 0 10px var(--rb-gold-glow));
  }
  .rune svg { width: 100%; height: 100%; }

  .uploader-title {
    margin: 0 0 0.25rem;
    font-family: var(--rb-font-display);
    font-size: var(--rb-fs-md);
    letter-spacing: var(--rb-tracking-wide);
    text-transform: uppercase;
    color: var(--rb-vellum);
  }
  .uploader-sub {
    margin: 0;
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-dim);
    font-style: italic;
  }

  @keyframes pulse-rift {
    0%, 100% { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.35),
                            0 8px 26px rgba(212, 176, 106, 0.18); }
    50%      { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.55),
                            0 14px 38px rgba(212, 176, 106, 0.32); }
  }
</style>
