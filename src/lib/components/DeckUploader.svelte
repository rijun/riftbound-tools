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
  <p>Drop deck files (.txt or .json), or click to choose.</p>
  <input
    bind:this={inputEl}
    type="file"
    multiple
    accept=".txt,.json,application/json,text/plain"
    onchange={onChange}
    hidden
  />
</div>

<style>
  .uploader {
    border: 1px dashed #555;
    padding: 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s;
  }
  .uploader.dragging {
    background: rgba(255,255,255,0.04);
    border-color: #888;
  }
</style>
