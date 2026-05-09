# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Riftbound Decklist Analyzer — a static SvelteKit SPA for comparing Riftbound TCG decklists side by side. Runs entirely in the browser; no backend.

## Commands

```bash
npm install
npm run dev            # vite dev — http://localhost:5173
npm run build          # static build to dist/ (adapter-static)
npm run preview        # serve the built dist/
npm run check          # svelte-kit sync && svelte-check
npm test               # vitest run (single pass)
npm run test:watch     # vitest watch
npm run refresh-cards  # repopulate static/cards.json from riftcodex API
```

Run a single test file: `npx vitest run tests/state/derivation.test.ts`. Filter by name: `npx vitest run -t "core cards"`.

## Architecture

The codebase is intentionally split into four independent layers under `src/lib/`. Each is testable on its own and any one can be replaced without touching the others — preserve this separation when adding features.

- **`parser/`** — turns user input into `Deck` objects. Two entry points: `text-parser.ts` (`.txt` files with `Legend:` / `Champion:` / `MainDeck:` / `Sideboard:` / `Battlefields:` / `Runes:` headers) and `deck-code-parser.ts` (Riftbound deck codes via `@piltoverarchive/riftbound-deck-codes`). `parser/index.ts` exposes `parseFile`. Both parsers mirror the chosen Champion into the `main` zone — Champions are also regular main-deck cards.
- **`cards/`** — card database + lookup. `store.svelte.ts` is a singleton with `$state`/`$derived` runes; on boot it tries `localStorage` (`riftbound:cards-db`) then falls back to bundled `/cards.json`. `resolver.ts` builds name/id/short-code maps with a Levenshtein ≤ 2 fuzzy fallback for misspelled names. Lookup precedence in parsers: `byName` → `byShortCode` → `byId`.
- **`state/`** — UI-facing reactive state. `decks.svelte.ts` owns the deck list, search, sort, and `deckFilter`; persists the active comparison to `localStorage` (`riftbound:active-comparison`) on every mutation and restores on layout mount. `derivation.ts` is the pure function that turns `Deck[]` + options into `TableRow[]` (per-zone). `comparison.ts` handles import/export of `comparison-*.json` files and is also the persistence format used for localStorage.
- **`components/`** — Svelte 5 components (use the `$props`, `$state`, `$derived` rune syntax, not legacy `export let`). `theme/domains.ts` maps deck rune composition → accent color; values mirror `--rb-domain-*` CSS custom properties in `theme/tokens.css`.

The route shell (`src/routes/+page.svelte`) is just a layout; all logic lives in `lib/`. `+page.ts` sets `prerender = true` — the app is a single prerendered HTML file.

## Card database

`static/cards.json` is a snapshot bundled into the build. Two refresh paths:

- **Developer:** `npm run refresh-cards` (pages `https://api.riftcodex.com/cards`, rewrites the file). Commit the result and redeploy.
- **User (in-app):** the *Refresh card DB* button fetches into `localStorage` only — does **not** touch the bundled file. The store overlays cached → bundled, so user refreshes affect only their session.

When working with card data, the `Resolver` is the only thing that should know about lookup strategies. Don't reach into `cards.json` directly from components or parsers.

## Persistence model

Two independent `localStorage` keys:

- `riftbound:cards-db` — the card DB cache (written by `cardStore.refreshFromApi`).
- `riftbound:active-comparison` — the current set of decks (written by every `decksState` mutation). Format is identical to the exported `comparison-YYYY-MM-DD.json`.

Both reads and writes are wrapped in try/catch — quota errors and SSR (no `localStorage`) must be handled silently; in-memory state is the source of truth.

## Testing notes

- `tests/setup.ts` installs a minimal in-memory `localStorage` shim, because Node 25+ ships a native `globalThis.localStorage` that lacks `setItem`/`clear`/etc. Tests that touch persistence rely on this; don't bypass it.
- `tests/fixtures/*.txt` are real deck files — use them rather than inlining new fixture strings when adding parser tests.
- Environment is `jsdom`; tests live under `tests/**/*.{test,spec}.{js,ts}` (mirrors the `src/lib/` layout).

## Design specs

Long-form specs and implementation plans live under `docs/superpowers/`. Read the relevant spec before making non-trivial changes to parser semantics, the comparison file format, or the derivation algorithm — those have invariants documented there that aren't obvious from the code alone.