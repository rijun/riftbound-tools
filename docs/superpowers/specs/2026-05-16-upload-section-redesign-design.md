# Upload Section Redesign — Design

**Date:** 2026-05-16

## Goal

Replace the current three-column upload area (`Decks` | `Comparisons` | `Comparisons` — drop / paste / restore) with a two-column layout that reflects the real action hierarchy: adding a deck is primary, restoring a saved comparison is secondary. Unify file-drop and deck-code paste into a single *Add a deck* panel; demote *Restore comparison* into a narrower side panel.

The redesign is purely a UI restructuring. Parser logic, the card database, the state layer, and the persistence model are unchanged.

## Problems with the current layout

- Three equal-width columns visually suggest three co-equal actions, but they aren't. Dropping deck files is used every session; pasting a deck code is the alternate input for the same intent; restoring a saved comparison is a rare ~once-per-session action.
- The two right-hand columns both carry the section label `COMPARISONS`, even though one is "paste a deck" (adds a single deck) and the other is "restore a saved comparison" (replaces the working set). This is a labeling bug.
- The dropzone and the paste box are separate cards despite expressing the same intent ("add a deck to the comparison"). The user has to scan two panels to decide where their input goes.

## High-level architecture

- New top-level container `AddDeckPanel` merges the current `DeckUploader` (drop) and `DeckPastePanel` (paste) into one card.
- The page-level `.upload-grid` becomes a two-column grid: a wide `Add a deck` panel on the left, a narrow `Restore comparison` panel on the right.
- The grid stays full-size after decks are loaded — no collapse, no hide-on-loaded behavior.
- Existing parser, card-store, and decks-state modules are not touched.

## Module changes

```
src/lib/components/
├── AddDeckPanel.svelte          # NEW — merges DeckUploader + DeckPastePanel
├── ComparisonUploader.svelte    # MODIFY — slim visual variant for narrow column
├── DeckUploader.svelte          # DELETE — superseded
└── DeckPastePanel.svelte        # DELETE — superseded

src/routes/+page.svelte          # MODIFY — new two-column .upload-grid
```

No changes under `src/lib/parser/`, `src/lib/cards/`, `src/lib/state/`, or `src/lib/theme/`.

## `AddDeckPanel` internals

Single bordered card (`.panel` look from current `DeckPastePanel`). The outer `.side-label` above the panel already labels the card "Add a deck", so the panel does not repeat that heading internally. Top-to-bottom:

1. **Dropzone (dominant)** — same behavior and visual treatment as the current `DeckUploader`: dashed inset border with corner ticks, sigil glyph, "DROP YOUR DECKLISTS HERE" caption, "Drop .txt deck files — or click to summon the file picker" sub-label. Click anywhere to open the file picker. Multi-file upload supported (each file becomes a deck). The dropzone's own border is a dashed inset, not a separate card, so it reads as one unit with the panel.
2. **`◇ or paste ◇` divider** — the same gold-hairline divider style currently used as the heading of `DeckPastePanel`, repurposed as an inline seam between the drop and paste affordances.
3. **Textarea** — full width, monospace, placeholder `Paste a Riftbound deck code or decklist text…`, 3 rows, vertically resizable.
4. **Bottom row** — `[ Deck name (optional) ] [ Add deck ]`. Name input flexes to fill width; gold `Add deck` button on the right.

Behavior notes:

- The drop affordance and the paste affordance are independent submit paths. Dropping files ingests them immediately. The textarea + `Add deck` button is its own submit. Same as today, just colocated.
- All inputs are always visible — no tabs, no toggles, no progressive disclosure.
- Component receives no props; it reads `cardStore` and writes through `decksState`, exactly like the two current components do.
- Toasts (`addToast`) for error reporting use the existing flow.

## `ComparisonUploader` modifications

Visual changes only — no behavior change.

- Smaller `min-height` on the dropzone so it fits a narrower column without empty vertical space.
- Tighter interior padding.
- Smaller sigil/glyph and heading.
- Keep the dashed border with corner ticks and the `.json` chip in the sub-label, so it still reads as part of the codex aesthetic.

## Page layout

In `src/routes/+page.svelte`:

```
.upload-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}
@media (max-width: 900px) {
  .upload-grid { grid-template-columns: 1fr; }
}
```

The ratio `2.4 : 1` is a starting value, to be adjusted in the browser if either panel feels visually starved or bloated.

Section labels:

- Left column: `Add a deck` (replaces `Decks`).
- Right column: `Restore comparison` (replaces the duplicate `Comparisons`).

Label styling (`.side-label`) is unchanged — gold mono caps, hairline underline, gold tick — so the masthead echo carries through.

## Responsive behavior

- Below 900px viewport width, the grid collapses to a single column. The `Add a deck` panel sits on top at full width; `Restore comparison` sits beneath, also full width.
- The current 720px breakpoint in `.upload-grid` is raised to 900px because two columns start feeling tight before then.
- The masthead's existing 640px breakpoint is unchanged.

## Empty / loaded states

- Empty state (no decks loaded): the `Drop deck files to begin the divination.` message renders below the upload grid, as today.
- Loaded state (one or more decks): `MetaPanel`, `Toolbar`, `ComparisonTable` render below the upload grid, as today. The upload grid itself does not change size, hide, or collapse.

## Testing notes

- No new unit tests required — the redesign moves DOM around without changing parser, store, or state-layer logic.
- Verify in the browser: drop a single `.txt`, drop multiple `.txt` files, paste a deck code, paste decklist text, restore a saved `comparison-*.json`, all behave as before.
- Verify the responsive collapse around 900px.
- Confirm `localStorage` persistence (`riftbound:active-comparison`) is unaffected.

## Out of scope

- Masthead changes.
- Theme tokens.
- Parser / resolver changes.
- Comparison table, toolbar, meta panel, or other downstream UI.
- Card database refresh button placement.
- New file formats or new input methods.
- Hiding or collapsing the upload area once decks are loaded.