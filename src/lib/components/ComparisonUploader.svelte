<script lang="ts">
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { parseComparison, InvalidComparisonError } from '$lib/state/comparison.ts';
  import { addToast } from './toaster-store.svelte.ts';

  let dragging = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const comparison = parseComparison(text);
      const previous = decksState.decks.length;
      decksState.replaceAll(comparison.decks);
      addToast({
        kind: 'info',
        message: previous > 0
          ? `Replaced ${previous} deck${previous === 1 ? '' : 's'} with ${comparison.decks.length} from ${file.name}.`
          : `Loaded ${comparison.decks.length} deck${comparison.decks.length === 1 ? '' : 's'} from ${file.name}.`
      });
    } catch (e) {
      const msg = e instanceof InvalidComparisonError ? e.message : (e as Error).message;
      addToast({ kind: 'error', message: `${file.name}: ${msg}` });
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
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
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
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
      <!-- Two interlocking triangles — duality, comparison -->
      <path d="M16 5 L26 22 L6 22 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="M16 27 L6 10 L26 10 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" opacity="0.6"/>
      <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  </span>
  <p class="uploader-title">Restore a comparison</p>
  <p class="uploader-sub">Drop a saved <code>.json</code> &mdash; or click to summon the file picker</p>
  <input
    bind:this={inputEl}
    type="file"
    accept=".json,application/json"
    onchange={onChange}
    hidden
  />
</div>

<style>
  .uploader {
    position: relative;
    border: 1px dashed var(--rb-line-strong);
    padding: var(--rb-space-4) var(--rb-space-3);
    border-radius: var(--rb-radius-lg);
    cursor: pointer;
    text-align: center;
    background:
      radial-gradient(ellipse 60% 70% at 50% 30%,
        rgba(111, 124, 255, 0.06),
        transparent 70%),
      var(--rb-ink-1);
    color: var(--rb-vellum-mute);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
    width: 24px;
    height: 24px;
    color: var(--rb-gold);
    margin-bottom: var(--rb-space-2);
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
    margin: 0 0 0.2rem;
    font-family: var(--rb-font-display);
    font-size: var(--rb-fs-sm);
    letter-spacing: var(--rb-tracking-wide);
    text-transform: uppercase;
    color: var(--rb-vellum);
  }
  .uploader-sub {
    margin: 0;
    font-size: var(--rb-fs-xs);
    color: var(--rb-vellum-dim);
    font-style: italic;
  }
  .uploader-sub code {
    font-family: var(--rb-font-mono);
    font-size: 0.92em;
    font-style: normal;
    color: var(--rb-vellum-mute);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--rb-line);
    padding: 0.05em 0.4em;
    border-radius: var(--rb-radius-xs);
  }

  @keyframes pulse-rift {
    0%, 100% { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.35),
                            0 8px 26px rgba(212, 176, 106, 0.18); }
    50%      { box-shadow: 0 0 0 1px rgba(212, 176, 106, 0.55),
                            0 14px 38px rgba(212, 176, 106, 0.32); }
  }
</style>
