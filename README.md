# Riftbound Decklist Analyser

A static web app for comparing Riftbound TCG decklists side by side. Drop multiple deck files (or paste deck codes) and the app builds a comparison table with per-card copy counts, core-card highlighting, rune-domain accents, and inline card detail.

Card data is enriched from the [riftcodex API](https://api.riftcodex.com), bundled into the build as `static/cards.json` and refreshable from the running app.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vitest
npm run check        # type check
npm run build        # static build to dist/
npm run preview      # serve the built dist/
```

## Card database

The card DB is a snapshot bundled into the build. Refresh it when a new set drops:

```bash
npm run refresh-cards
```

This pages through the riftcodex `/cards` endpoint and rewrites `static/cards.json`. Commit the result, then redeploy. Users can also click *Refresh card DB* in the running app — that fetches the latest into `localStorage` for their session, but doesn't update the bundled snapshot.

## Importing decks

Three input paths:

- **Drop `.txt` deck files** in the format used by riftcodex / common deck-builders. Section headers `Legend:`, `Champion:`, `MainDeck:`, `Battlefields:`, `Runes:`, `Sideboard:` set the current zone; lines like `3 Stupefy` are card entries.
- **Paste a Riftbound deck code** in the panel below the file uploader. Decoded via [`@piltoverarchive/riftbound-deck-codes`](https://github.com/Piltover-Archive/RiftboundDeckCodes); cards are re-bucketed into zones using the card DB's classification.
- **Drop a saved comparison `.json`** (right-side panel) to restore a previously exported set of decks.

## Exporting

The Toolbar's *Export comparison* button downloads the current set of decks as a single `comparison-YYYY-MM-DD.json` file. Re-drop it later (or share with someone else) to restore the comparison.

## Stack

SvelteKit 2 + Svelte 5 (runes), `@sveltejs/adapter-static`, Vitest.

## Specs and plans

Design specs and implementation plans live under `docs/superpowers/`.

## License

Licensed under [AGPL-3.0](LICENSE). © 2026 rijun.
