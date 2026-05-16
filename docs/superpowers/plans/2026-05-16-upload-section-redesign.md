# Upload Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current three-column upload grid (Decks / Comparisons / Comparisons) with a two-column layout: a unified `Add a deck` panel that combines file-drop and deck-code paste, and a narrower `Restore comparison` panel beside it.

**Architecture:** Pure UI restructuring. A new `AddDeckPanel.svelte` component owns both the drop and paste affordances inside a single bordered card. `ComparisonUploader.svelte` is visually slimmed for the narrower side column. `src/routes/+page.svelte` is updated to a 2-column grid with corrected section labels and a higher responsive breakpoint. Parser, card store, and state-layer modules are not touched.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vite, existing `--rb-*` theme tokens.

**Spec:** `docs/superpowers/specs/2026-05-16-upload-section-redesign-design.md`.

**Note on testing:** This is a DOM-restructuring refactor with no new logic. The underlying parser/store/state modules already have unit-test coverage, and the spec explicitly says no new unit tests are required. Verification is done via TypeScript compile (`npm run check`) plus an end-of-plan browser smoke test of all four entry points (drop / paste / restore / responsive).

---

## File Structure

```
src/lib/components/
├── AddDeckPanel.svelte          # CREATE — merges DeckUploader + DeckPastePanel
├── ComparisonUploader.svelte    # MODIFY — slim treatment for narrow side column
├── DeckUploader.svelte          # DELETE
└── DeckPastePanel.svelte        # DELETE

src/routes/+page.svelte          # MODIFY — 2-col upload-grid, new side labels, raised breakpoint
```

No changes outside `src/lib/components/` and `src/routes/+page.svelte`.

---

## Task 1: Create `AddDeckPanel.svelte`

**Files:**
- Create: `src/lib/components/AddDeckPanel.svelte`

The new component is a single bordered `<section class="panel">` that contains, top-to-bottom: the dropzone (with corner-tick frame and rune sigil), a `◇ or paste ◇` divider, a textarea, and a row with a "Deck name (optional)" input and a gold "Add deck" button.

The dropzone behavior is ported verbatim from `DeckUploader.svelte`. The paste behavior (including `pastedCounter` for default names) is ported verbatim from `DeckPastePanel.svelte`. The two paths are independent submit channels: dropping files ingests immediately; the textarea + button is its own submit.

The outer `.side-label` in `+page.svelte` will label this card "Add a deck", so the panel itself carries no internal "Add a deck" heading.

- [ ] **Step 1: Write the full component file**

Create `src/lib/components/AddDeckPanel.svelte` with this exact content:

```svelte
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
    <p class="dropzone-title">Drop your decklists here</p>
    <p class="dropzone-sub">Drop .txt deck files &mdash; or click to summon the file picker</p>
    <input
      bind:this={inputEl}
      type="file"
      multiple
      accept=".txt,text/plain"
      onchange={onChange}
      hidden
    />
  </div>

  <div class="seam" aria-hidden="true">
    <span class="seam-mark">◇</span>
    <span class="seam-text">or paste</span>
    <span class="seam-mark">◇</span>
  </div>

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

  /* ===== Dropzone (inset inside panel) ===== */
  .dropzone {
    position: relative;
    border: 1px dashed var(--rb-line-strong);
    padding: var(--rb-space-5) var(--rb-space-4);
    border-radius: var(--rb-radius-md);
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
  .corner.tl { top: 8px; left: 8px;  border-right: none; border-bottom: none; }
  .corner.tr { top: 8px; right: 8px; border-left: none;  border-bottom: none; }
  .corner.bl { bottom: 8px; left: 8px;  border-right: none; border-top: none; }
  .corner.br { bottom: 8px; right: 8px; border-left: none;  border-top: none; }
  .dropzone:hover .corner,
  .dropzone.dragging .corner { opacity: 1; border-color: var(--rb-gold); }

  .rune {
    display: inline-block;
    width: 30px;
    height: 30px;
    color: var(--rb-gold);
    margin-bottom: var(--rb-space-3);
    transition: transform var(--rb-dur-base) var(--rb-ease-out),
                filter var(--rb-dur-base) var(--rb-ease-out);
  }
  .dropzone:hover .rune,
  .dropzone.dragging .rune {
    transform: translateY(-2px) scale(1.05);
    filter: drop-shadow(0 0 10px var(--rb-gold-glow));
  }
  .rune svg { width: 100%; height: 100%; }

  .dropzone-title {
    margin: 0 0 0.25rem;
    font-family: var(--rb-font-display);
    font-size: var(--rb-fs-md);
    letter-spacing: var(--rb-tracking-wide);
    text-transform: uppercase;
    color: var(--rb-vellum);
  }
  .dropzone-sub {
    margin: 0;
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-dim);
    font-style: italic;
  }

  /* ===== "or paste" seam ===== */
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: PASS — no new errors. (The component compiles in isolation even before it's wired into the page; `npm run check` runs `svelte-kit sync && svelte-check` over the whole tree.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AddDeckPanel.svelte
git commit -m "feat(ui): add unified AddDeckPanel combining drop and paste"
```

---

## Task 2: Wire `AddDeckPanel` into `+page.svelte` with new 2-column layout

**Files:**
- Modify: `src/routes/+page.svelte`

Swap the three-column `.upload-grid` for a two-column grid: wide `Add a deck` (using the new `AddDeckPanel`) on the left, narrow `Restore comparison` (existing `ComparisonUploader`) on the right. Update side labels accordingly and raise the responsive breakpoint from 720px to 900px. The old `DeckUploader` and `DeckPastePanel` imports are removed.

- [ ] **Step 1: Update the imports in `+page.svelte`**

Replace the imports at the top of the `<script>` block:

```svelte
<script lang="ts">
  import AddDeckPanel from '$lib/components/AddDeckPanel.svelte';
  import ComparisonUploader from '$lib/components/ComparisonUploader.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import MetaPanel from '$lib/components/MetaPanel.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import { decksState } from '$lib/state/decks.svelte.ts';
</script>
```

(Removes the `DeckUploader` and `DeckPastePanel` imports; adds `AddDeckPanel`.)

- [ ] **Step 2: Replace the `.upload-grid` markup**

Replace the existing `<div class="upload-grid">…</div>` block (currently three `<div>`s for decks-side / comparisons-side / comparisons-side) with:

```svelte
<div class="upload-grid">
  <div class="upload-col">
    <h2 class="side-label">Add a deck</h2>
    <AddDeckPanel />
  </div>
  <div class="upload-col">
    <h2 class="side-label">Restore comparison</h2>
    <ComparisonUploader />
  </div>
</div>
```

- [ ] **Step 3: Update the `.upload-grid` CSS**

Replace the existing `.upload-grid` and `.decks-side, .comparisons-side` rules and the `@media (max-width: 720px)` rule near the bottom of the `<style>` block with:

```css
/* ===== Upload grid ===== */
.upload-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}
.upload-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

And update the responsive block so the upload grid collapses at 900px (replacing the old 720px rule):

```css
/* ===== Responsive ===== */
@media (max-width: 900px) {
  .upload-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .masthead-inner {
    grid-template-columns: 1fr;
    text-align: center;
    justify-items: center;
  }
}
```

The `.side-label` rule (with its `::after` gold tick) is unchanged.

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: PASS — no new errors. Svelte-check will warn if any import is unresolved.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat(ui): switch upload area to two-column layout with AddDeckPanel"
```

---

## Task 3: Slim `ComparisonUploader` for the narrow side column

**Files:**
- Modify: `src/lib/components/ComparisonUploader.svelte`

Visual changes only — no behavior change. The component still drops a `.json`, parses it via `parseComparison`, and calls `decksState.replaceAll`. We just trim its visual weight so it fits beside the wider add-deck panel without empty vertical space.

- [ ] **Step 1: Edit the `.uploader` CSS rule**

In `src/lib/components/ComparisonUploader.svelte`, replace the existing `.uploader { ... }` rule (the first rule in the `<style>` block) with:

```css
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
```

Only the padding changes: `var(--rb-space-6) var(--rb-space-5)` → `var(--rb-space-4) var(--rb-space-3)`. The rest of the rule stays.

- [ ] **Step 2: Shrink the sigil and title**

Replace the `.rune` rule:

```css
.rune {
  display: inline-block;
  width: 24px;
  height: 24px;
  color: var(--rb-gold);
  margin-bottom: var(--rb-space-2);
  transition: transform var(--rb-dur-base) var(--rb-ease-out),
              filter var(--rb-dur-base) var(--rb-ease-out);
}
```

(Width/height `30px → 24px`, margin-bottom `--rb-space-3 → --rb-space-2`.)

Replace the `.uploader-title` rule:

```css
.uploader-title {
  margin: 0 0 0.2rem;
  font-family: var(--rb-font-display);
  font-size: var(--rb-fs-sm);
  letter-spacing: var(--rb-tracking-wide);
  text-transform: uppercase;
  color: var(--rb-vellum);
}
```

(Font-size `--rb-fs-md → --rb-fs-sm`.)

Replace the `.uploader-sub` rule:

```css
.uploader-sub {
  margin: 0;
  font-size: var(--rb-fs-xs);
  color: var(--rb-vellum-dim);
  font-style: italic;
}
```

(Font-size `--rb-fs-sm → --rb-fs-xs`.)

The `.corner.*`, `.uploader.dragging`, hover rules, `.uploader-sub code`, and `@keyframes pulse-rift` are unchanged.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ComparisonUploader.svelte
git commit -m "style(ui): slim ComparisonUploader for narrow side column"
```

---

## Task 4: Delete the superseded `DeckUploader` and `DeckPastePanel`

**Files:**
- Delete: `src/lib/components/DeckUploader.svelte`
- Delete: `src/lib/components/DeckPastePanel.svelte`

These are no longer imported by anything (Task 2 removed the last references). Verify, then delete.

- [ ] **Step 1: Confirm nothing imports the two files**

Run: `grep -rn "DeckUploader\|DeckPastePanel" src/ tests/`
Expected: zero matches (no source file or test imports either component).

- [ ] **Step 2: Delete the files**

Run:

```bash
git rm src/lib/components/DeckUploader.svelte src/lib/components/DeckPastePanel.svelte
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(ui): remove superseded DeckUploader and DeckPastePanel"
```

---

## Task 5: Browser smoke test

**Files:** none.

Spin up the dev server and exercise every entry point in a browser. The spec says no new unit tests are required, so this is the functional verification step.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite reports `Local: http://localhost:5173/`. Open that URL.

- [ ] **Step 2: Verify the empty-state layout**

Observe the two-column upload area:
- Left column: wider, labeled `Add a deck` (gold mono caps, hairline rule, gold tick under the label).
- Right column: narrower, labeled `Restore comparison`. No more duplicate `Comparisons` label.
- Below the grid: the italic empty-state message `Drop deck files to begin the divination.`

- [ ] **Step 3: Drop a `.txt` deck file**

Drag a real `.txt` deck (e.g. one of the files under `tests/fixtures/`) onto the left dropzone. Expected: the deck appears in `MetaPanel` + `ComparisonTable` below. No console errors.

- [ ] **Step 4: Drop multiple `.txt` files at once**

Drag two `.txt` decks simultaneously. Expected: both decks ingest, each becomes its own column.

- [ ] **Step 5: Paste a deck code**

Paste a valid Riftbound deck code into the textarea, optionally type a deck name, click `Add deck`. Expected: a new deck appears with the given name (or `Pasted deck N` if name was blank); the textarea and name input clear; the counter increments next time.

- [ ] **Step 6: Paste decklist text**

Repeat Step 5 with raw decklist text (`Legend: …` / `Champion: …` / `MainDeck: …`). Expected: same result.

- [ ] **Step 7: Restore a saved comparison**

Click `Export comparison` from the `Toolbar` (or use a previously exported `comparison-*.json`), then drop it on the right-hand panel. Expected: a toast confirms the replacement; the existing decks are replaced by the decks from the file.

- [ ] **Step 8: Verify the responsive collapse**

Resize the window narrower than 900px (DevTools responsive mode). Expected: the upload grid collapses to a single column — `Add a deck` panel on top, `Restore comparison` panel beneath, both full width. Resize wider — two columns return.

- [ ] **Step 9: Verify `localStorage` persistence is unaffected**

With one or more decks loaded, reload the page. Expected: the decks are restored from `riftbound:active-comparison` (existing behavior, must still work after the redesign).

- [ ] **Step 10: Stop the dev server**

Hit `Ctrl-C` in the terminal where `npm run dev` is running.

- [ ] **Step 11: No commit**

This task makes no file changes. If any step failed, fix the underlying code (most likely in Task 1 or Task 2), re-commit, and re-run the smoke test.
