# Riftbound Decklist Analyser — Design

**Date:** 2026-05-06

## Goal

A local web app that compares multiple Riftbound TCG decklists side by side. Each uploaded file becomes one column; one row per distinct card; copy counts shown per deck with visual encoding. Card detail (text, type, cost, image, etc.) is enriched from the riftcodex card database.

The app runs entirely in the browser. No backend.

## High-level architecture

- **Static SvelteKit SPA** built with `@sveltejs/adapter-static` to a `dist/` folder. Open `dist/index.html` directly or host anywhere.
- **Svelte 5 with runes** (`$state`, `$derived`) for reactive state.
- **No backend.** All file reading via the `FileReader` API.
- **Card database: hybrid.** A `cards.json` is bundled into the build; a developer script (`scripts/refresh-cards.ts`) pages the riftcodex API and rewrites the bundled file. At runtime, the user can also click *Refresh card DB* to fetch fresh data and store it in `localStorage`. Lookup precedence: `localStorage` → bundled `cards.json` → API on demand.

## Module layout

```
src/
├── lib/
│   ├── parser/
│   │   ├── text-parser.ts      # .txt format
│   │   ├── json-parser.ts      # tournament JSON format
│   │   └── types.ts            # Deck, DeckEntry, Zone types
│   ├── cards/
│   │   ├── store.svelte.ts     # card DB reactive state, localStorage cache, refresh
│   │   └── resolver.ts         # name/id lookup, fuzzy fallback
│   ├── state/
│   │   └── decks.svelte.ts     # loaded decks, search, sort, deck filter
│   ├── components/
│   │   ├── DeckUploader.svelte
│   │   ├── Toolbar.svelte
│   │   ├── ComparisonTable.svelte
│   │   ├── CardRow.svelte
│   │   ├── CardDetail.svelte
│   │   └── MetaPanel.svelte
│   └── theme/                  # Riftbound visual tokens (domain colors, etc.)
├── routes/
│   ├── +layout.svelte          # global styling
│   └── +page.svelte            # main shell
└── scripts/
    └── refresh-cards.ts        # dev script to repopulate bundled cards.json
static/
└── cards.json                  # bundled card DB snapshot
```

The split keeps parsing, card resolution, and UI strictly independent — each is testable on its own and any one can be replaced without touching the others.

## Data model

```ts
type Zone =
  | 'legend'
  | 'champion'
  | 'main'
  | 'sideboard'
  | 'battlefields'
  | 'runes';

type DeckEntry = {
  count: number;
  cardName: string;       // resolved name, or raw input if unresolved
  cardId?: string;        // riftcodex id, when known
  raw: string;            // original input line / id, for debugging
};

type Deck = {
  id: string;             // generated UUID per uploaded deck
  name: string;           // from filename stem or metadata.name
  source: 'text' | 'json';
  zones: Record<Zone, DeckEntry[]>;
  warnings: string[];     // unparsed lines, unresolved cards
};

type Card = {
  // mirrors riftcodex CardResponse:
  id: string;
  name: string;
  riftbound_id?: string;
  tcgplayer_id?: number;
  energy?: number;
  might?: number;
  power?: number;
  type?: string;
  rarity?: string;
  domain?: string;
  supertype?: string;
  text?: string;
  rich_text?: string;
  image_url?: string;
  artist?: string;
  set?: { set_id: string; label: string };
  tags?: string[];
  // ... other fields exposed by the API as needed
};
```

## Parsing rules

### Text parser (`text-parser.ts`)

- One file = one deck. Deck name = filename stem (e.g. `synthetic_deck.txt` → "Synthetic Deck" after underscore→space + title-case).
- Section headers (case-sensitive, trailing colon): `Legend:`, `Champion:`, `MainDeck:`, `Battlefields:`, `Runes:`, `Sideboard:`. The header sets the current zone.
- Card lines match `^\s*(\d+)\s+(.+?)\s*$`. Quantity + name.
- Strip parenthetical set codes from names: `Diana, Scorn of the Moon (UNL-197)` → `Diana, Scorn of the Moon`.
- Skip blank lines and unrecognized lines; record skipped lines in `deck.warnings`.

### JSON parser (`json-parser.ts`)

- Read `metadata.name` for the deck name (fall back to filename stem).
- Map `deck["Main Board"]` to the `main` zone, `deck["Side Board"]` to `sideboard`. Each entry has `id` and `count`.
- Resolve each `id` via the card resolver to get the display name. Unresolved ids fall back to displaying the raw id.
- Other zones (Legend, Champion, Battlefields, Runes) are absent from the JSON format; the deck simply has empty arrays for those zones.

## Card resolution

`resolver.ts` exposes:
- `byId(id) → Card | undefined`
- `byName(name) → Card | undefined` — exact match first, then case-insensitive, then fuzzy fallback (Levenshtein ≤ 2) for typos.
- A miss returns `undefined`; the row falls back to displaying the raw input.

## Data flow

1. User drops files into `DeckUploader` → each file read with `FileReader` → format detected (`.json` extension or leading `{`) → parser returns a `Deck`.
2. Parsed decks pushed into `decks.svelte.ts` reactive state. Re-dropping a file with the same name replaces the existing deck.
3. Card DB store loads on app start: localStorage → bundled `cards.json`. A *Refresh card DB* button kicks off a paged fetch from the riftcodex API.
4. The comparison table is a `$derived` computation from `(decks, search, sort, deckFilter)` → `{ mainRows: TableRow[], sideRows: TableRow[] }`. Svelte 5 only recomputes when inputs change.
5. Each `TableRow` carries `{ cardName, cardId?, countsPerDeck: number[], totalCopies, presence, isCore }`. Visual encoding is pure presentation derived from this row.
6. Expanding a row resolves the card lazily and renders `CardDetail`.

## Comparison table

- **One continuous table.** Main Deck rows on top; a thicker section divider with a small "Sideboard" label; Sideboard rows below.
- **Columns:** card name, one column per deck (count, `—` for absent), `Max` column, expander control.
- **Visual encoding:**
  - Cell background opacity scales with count: 1 → ~33%, 2 → ~66%, 3 → ~100% of the deck-column accent color.
  - Each deck column accent is derived from its dominant rune domain (Body / Chaos / Mind / Calm / Order / Fury). "Dominant" = the domain with the highest rune count in the `Runes` zone; ties broken by the order Body → Chaos → Mind → Calm → Order → Fury. If a deck has no `Runes` zone (e.g., tournament JSON files), the accent falls back to a neutral gray.
  - "Core" rows (cards present in every deck for that section) get a subtle row highlight + a dot on the card name.
  - Champion variant displayed as a subtitle row beneath each deck name.
- **Sort applies within each section.** Sort options: A–Z, by presence (descending), by total copies (descending).
- **Search** is a substring filter on card name (case-insensitive), live.
- **Deck filter** narrows rows to "cards present in deck X." Other deck columns remain visible for comparison.
- **Row click expands inline (accordion):** image, type, energy, power, might, rarity, domain tags, card text, flavor text, set info. One row open at a time. No modal — comparison context stays visible.

## Meta panel and table header

- **Table header (always visible):** for each deck — deck name, remove button, drag handle for reordering, Champion variant subtitle.
- **MetaPanel (collapsible, sits above the table):** for each deck — Legend, Battlefields list, Runes totals (per domain), main deck total card count, sideboard total card count.

## Visual style

**Riftbound / League-of-Legends-flavored** — dark theme, accent colors per rune domain, thematic but not gimmicky. Detailed visual design (component styling, typography, color tokens, layout polish) is delivered during implementation via the **frontend-design** skill, to keep the UI distinctive and avoid generic AI aesthetics.

## Error handling

- Parser tolerates unrecognized lines (skipped, surfaced in `deck.warnings`).
- Card resolution miss → row shows raw input plus a small `?` indicator; expanding the row shows "no match in card DB."
- Card DB refresh failure → non-blocking banner; falls back to localStorage cache, then bundled `cards.json`. The app always has something to render.
- Malformed dropped file → red toast with parser error + filename; other files in the same drop still load.
- Re-dropping a file with the same filename replaces the existing deck.

## Testing

Vitest, unit-only:
- **Parser:** text format (zones, set-code stripping, junk-line tolerance, every fixture in `decks/`), JSON format (id-based resolution path), edge cases (whitespace, trailing newlines, missing zones).
- **Card resolver:** id match, exact name, case-insensitive name, fuzzy fallback, miss path.
- **Table derivation:** given fixed deck inputs, assert correct presence counts, per-section core-card detection, sort orders.
- E2E/Playwright deferred. Overkill for a tool that's iterated by hand.

## MVP scope

**In:**
- Drag-and-drop multi-file upload (`.txt` and tournament `.json`).
- One continuous comparison table with Main + Sideboard sections.
- Card detail expansion with image and full card fields.
- Search, sort, deck filter, deck remove + reorder.
- Battlefields / Runes / totals meta panel per deck.
- Bundled `cards.json` + manual API refresh, localStorage cache.
- Riftbound-themed visual design via frontend-design skill.

**Out (deferred, post-MVP):**
- CSV / image export.
- Highlight cards unique to exactly one deck.
- Side-by-side diff view for two decks.
- Persist uploaded decks across sessions.

## Open items / assumptions

- The `decks/` folder is treated as test fixtures, not as bundled sample decks in the app. The user re-drops files each session.
- riftcodex API CORS support is not documented; if browser refresh hits CORS, the user will rely on the bundled `cards.json` and re-run `scripts/refresh-cards.ts` in Node when a new set drops.
- The project is not yet a git repository. Will be initialized as part of implementation kickoff.
