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
  <p>Drop a saved comparison (.json), or click to choose.</p>
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
    border: 1px dashed var(--rb-line, #555);
    padding: 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s, border-color 0.15s;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .uploader.dragging {
    background: rgba(255,255,255,0.04);
    border-color: var(--rb-vellum-dim, #888);
  }
  p { margin: 0; }
</style>
