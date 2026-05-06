# Riftbound Decklist Analyser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static SvelteKit web app that compares multiple Riftbound TCG decklists side by side, with card detail enrichment from a bundled JSON dump of the riftcodex card database (refreshable from the API at runtime).

**Architecture:** Static SvelteKit SPA built with `adapter-static`. All client-side. Pure-logic modules (parser, card resolver, table derivation) are unit-tested with Vitest in TDD style. UI components built with Svelte 5 runes (`$state`, `$derived`). Visual styling delivered via the `frontend-design` skill in dedicated tasks. Card DB lookup precedence: localStorage → bundled `static/cards.json` → API on demand.

**Tech Stack:** SvelteKit 2.x, Svelte 5 (runes), TypeScript, Vite, Vitest, `@sveltejs/adapter-static`. No backend.

**Spec:** `docs/superpowers/specs/2026-05-06-riftbound-decklist-analyser-design.md`.

---

## File Structure

```
riftbound-tools/
├── .gitignore
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── static/
│   ├── favicon.svg
│   └── cards.json                     # bundled card DB snapshot
├── scripts/
│   └── refresh-cards.ts               # node script: pages riftcodex API → static/cards.json
├── src/
│   ├── app.html
│   ├── app.css                        # global resets, font, css custom props
│   ├── routes/
│   │   ├── +layout.svelte             # global shell
│   │   └── +page.svelte               # main view
│   └── lib/
│       ├── parser/
│       │   ├── types.ts               # Deck, DeckEntry, Zone
│       │   ├── text-parser.ts
│       │   ├── json-parser.ts
│       │   └── index.ts               # parseFile() dispatch on filename / content
│       ├── cards/
│       │   ├── types.ts               # Card type mirrors riftcodex CardResponse
│       │   ├── resolver.ts            # byId, byName (exact / ci / fuzzy)
│       │   └── store.svelte.ts        # reactive Card DB + load + refresh
│       ├── state/
│       │   ├── decks.svelte.ts        # decks list, view filters, sort, search
│       │   └── derivation.ts          # pure derivation: decks → mainRows + sideRows
│       ├── theme/
│       │   ├── tokens.css             # --color-*, fonts, spacing, radii
│       │   └── domains.ts             # rune domain → accent color mapping
│       └── components/
│           ├── DeckUploader.svelte
│           ├── Toolbar.svelte
│           ├── ComparisonTable.svelte
│           ├── CardRow.svelte
│           ├── CardDetail.svelte
│           ├── MetaPanel.svelte
│           └── Toaster.svelte
├── tests/
│   ├── parser/
│   │   ├── text-parser.test.ts
│   │   └── json-parser.test.ts
│   ├── cards/
│   │   └── resolver.test.ts
│   ├── state/
│   │   └── derivation.test.ts
│   └── fixtures/
│       ├── synthetic_deck.txt    # copied from decks/
│       ├── another_synthetic_deck.txt
│       └── synthetic_tournament.json     # synthesized
└── decks/                             # left in place; user-facing sample files
```

Each module has one clear responsibility:
- `parser/` turns text or JSON into a `Deck`.
- `cards/` knows the card DB and how to look up cards.
- `state/` holds runtime state and derives table rows.
- `theme/` holds visual tokens.
- `components/` are presentational; they read state and emit events.

---

## Task 1: Initialize repo and SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `src/app.html`, `src/app.css`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `static/favicon.svg`

- [ ] **Step 1: Init git**

```bash
cd /Users/r.jung/Repos/riftbound-tools
git init
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules
.svelte-kit
build
dist
.vite
.DS_Store
*.log
.env
.env.*
!.env.example
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "riftbound-decklist-analyser",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "refresh-cards": "tsx scripts/refresh-cards.ts"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.6",
    "@sveltejs/kit": "^2.8.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@testing-library/svelte": "^5.2.4",
    "@types/node": "^22.9.0",
    "jsdom": "^25.0.1",
    "svelte": "^5.1.0",
    "svelte-check": "^4.0.7",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: installs without errors. (Versions are minimum-compatible at time of writing; if a newer minor exists, npm will resolve it.)

- [ ] **Step 5: Create `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: undefined,
      precompress: false,
      strict: true
    })
  }
};
```

- [ ] **Step 6: Create `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: false
  }
});
```

- [ ] **Step 7: Create `tsconfig.json`**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 8: Create `src/app.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Riftbound Decklist Analyser</title>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 9: Create `src/app.css` (placeholder, refined later)**

```css
:root {
  color-scheme: dark;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: system-ui, sans-serif;
  background: #0c0d10;
  color: #e8e8ee;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 10: Create `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 11: Create `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  export const prerender = true;
</script>

<main>
  <h1>Riftbound Decklist Analyser</h1>
  <p>Drop deck files to compare.</p>
</main>
```

- [ ] **Step 12: Create `static/favicon.svg` (minimal placeholder)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#0c0d10"/><circle cx="8" cy="8" r="4" fill="#c9a96b"/></svg>
```

- [ ] **Step 13: Verify dev server boots**

```bash
npm run dev
```

Expected: serves on `http://localhost:5173/`, page renders the heading. Stop the server.

- [ ] **Step 14: Verify build succeeds**

```bash
npm run build
```

Expected: `dist/` folder generated, no errors.

- [ ] **Step 15: Commit**

```bash
git add .
git commit -m "chore: scaffold SvelteKit + Svelte 5 + Vitest project"
```

---

## Task 2: Card type definitions and bundled placeholder

**Files:**
- Create: `src/lib/cards/types.ts`, `static/cards.json` (empty array placeholder)

- [ ] **Step 1: Create `src/lib/cards/types.ts`**

```ts
export type Card = {
  id: string;
  name: string;
  riftbound_id?: string;
  tcgplayer_id?: number;
  public_code?: string;
  collector_number?: string;
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
  accessibility_text?: string;
  set?: { set_id: string; label: string };
  tags?: string[];
  orientation?: string;
  clean_name?: string;
  alternate_art?: boolean;
  overnumbered?: boolean;
  signature?: boolean;
};

export type CardDb = {
  cards: Card[];
  fetchedAt: string; // ISO timestamp
  source: 'bundled' | 'api' | 'cache';
};
```

- [ ] **Step 2: Create `static/cards.json` placeholder**

```json
{ "cards": [], "fetchedAt": "1970-01-01T00:00:00.000Z", "source": "bundled" }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cards/types.ts static/cards.json
git commit -m "feat(cards): add Card and CardDb types and bundled placeholder"
```

---

## Task 3: Card refresh script

**Files:**
- Create: `scripts/refresh-cards.ts`

- [ ] **Step 1: Implement `scripts/refresh-cards.ts`**

```ts
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Card, CardDb } from '../src/lib/cards/types.ts';

const BASE = 'https://api.riftcodex.com';
const PAGE_SIZE = 100;

async function fetchPage(page: number): Promise<{ items: Card[]; total: number }> {
  const url = `${BASE}/cards?page=${page}&size=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  // Defensive: API shape uses `items` and `total` typically; fall back to `data`.
  const items: Card[] = data.items ?? data.data ?? data.cards ?? [];
  const total: number = data.total ?? data.count ?? items.length;
  return { items, total };
}

async function main() {
  console.log('Fetching cards from riftcodex API...');
  const all: Card[] = [];
  let page = 1;
  // First page to learn total
  const first = await fetchPage(page);
  all.push(...first.items);
  const totalPages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  console.log(`Total: ${first.total} cards across ${totalPages} page(s)`);
  for (page = 2; page <= totalPages; page++) {
    const { items } = await fetchPage(page);
    all.push(...items);
    console.log(`  page ${page}/${totalPages} (${all.length} so far)`);
  }
  const db: CardDb = {
    cards: all,
    fetchedAt: new Date().toISOString(),
    source: 'api'
  };
  const out = resolve('static/cards.json');
  await writeFile(out, JSON.stringify(db, null, 2));
  console.log(`Wrote ${all.length} cards to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script**

```bash
npm run refresh-cards
```

Expected: writes a populated `static/cards.json`. If the API errors or pages differently than assumed, fix the response-shape fallback (`data.items ?? data.data ?? data.cards`). Confirm `static/cards.json` is now > 1KB and contains real cards.

- [ ] **Step 3: Commit**

```bash
git add scripts/refresh-cards.ts static/cards.json
git commit -m "feat(cards): refresh script and bundled snapshot"
```

---

## Task 4: Card resolver — id and name lookup

**Files:**
- Create: `src/lib/cards/resolver.ts`, `tests/cards/resolver.test.ts`

- [ ] **Step 1: Write failing test**

`tests/cards/resolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Card } from '../../src/lib/cards/types.ts';
import { createResolver } from '../../src/lib/cards/resolver.ts';

const cards: Card[] = [
  { id: 'OGN-095', name: 'Stupefy' },
  { id: 'UNL-198', name: 'Ravenbloom Student' },
  { id: 'UNL-197', name: 'Diana, Scorn of the Moon' }
];

describe('createResolver', () => {
  it('finds a card by id', () => {
    const r = createResolver(cards);
    expect(r.byId('OGN-095')?.name).toBe('Stupefy');
  });

  it('returns undefined for unknown id', () => {
    const r = createResolver(cards);
    expect(r.byId('NOPE-001')).toBeUndefined();
  });

  it('finds a card by exact name', () => {
    const r = createResolver(cards);
    expect(r.byName('Stupefy')?.id).toBe('OGN-095');
  });

  it('finds a card by case-insensitive name', () => {
    const r = createResolver(cards);
    expect(r.byName('stupefy')?.id).toBe('OGN-095');
    expect(r.byName('RAVENBLOOM STUDENT')?.id).toBe('UNL-198');
  });

  it('finds a card by fuzzy name within Levenshtein 2', () => {
    const r = createResolver(cards);
    expect(r.byName('Stupfy')?.id).toBe('OGN-095'); // distance 1
    expect(r.byName('Ravenbloom Studnt')?.id).toBe('UNL-198'); // distance 1
  });

  it('returns undefined for fuzzy match beyond threshold', () => {
    const r = createResolver(cards);
    expect(r.byName('Completely Unrelated')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run tests/cards/resolver.test.ts
```

Expected: FAIL — `createResolver` does not exist.

- [ ] **Step 3: Implement `src/lib/cards/resolver.ts`**

```ts
import type { Card } from './types.ts';

export type Resolver = {
  byId: (id: string) => Card | undefined;
  byName: (name: string) => Card | undefined;
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function createResolver(cards: Card[]): Resolver {
  const byIdMap = new Map<string, Card>();
  const byExactName = new Map<string, Card>();
  const byLowerName = new Map<string, Card>();
  for (const c of cards) {
    byIdMap.set(c.id, c);
    byExactName.set(c.name, c);
    byLowerName.set(c.name.toLowerCase(), c);
  }
  return {
    byId: (id) => byIdMap.get(id),
    byName: (name) => {
      const exact = byExactName.get(name);
      if (exact) return exact;
      const ci = byLowerName.get(name.toLowerCase());
      if (ci) return ci;
      // fuzzy fallback within distance 2
      const target = name.toLowerCase();
      let best: { card: Card; d: number } | undefined;
      for (const [lower, card] of byLowerName) {
        const d = levenshtein(target, lower);
        if (d <= 2 && (!best || d < best.d)) best = { card, d };
        if (best?.d === 0) break;
      }
      return best?.card;
    }
  };
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/cards/resolver.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cards/resolver.ts tests/cards/resolver.test.ts
git commit -m "feat(cards): resolver with id/exact/ci/fuzzy lookups"
```

---

## Task 5: Card store with localStorage cache and refresh

**Files:**
- Create: `src/lib/cards/store.svelte.ts`

- [ ] **Step 1: Implement the store**

```ts
import type { Card, CardDb } from './types.ts';
import { createResolver, type Resolver } from './resolver.ts';

const LS_KEY = 'riftbound:cards-db';

function safeReadCache(): CardDb | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CardDb;
    if (!parsed?.cards || !Array.isArray(parsed.cards)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function safeWriteCache(db: CardDb) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    // quota / private mode — silently ignore; bundled file remains
  }
}

class CardStore {
  db = $state<CardDb | undefined>(undefined);
  resolver = $derived<Resolver | undefined>(
    this.db ? createResolver(this.db.cards) : undefined
  );
  refreshState = $state<{ status: 'idle' | 'loading' | 'error'; message?: string }>({
    status: 'idle'
  });

  async loadInitial(): Promise<void> {
    const cached = safeReadCache();
    if (cached) {
      this.db = { ...cached, source: 'cache' };
      return;
    }
    try {
      const res = await fetch('/cards.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundled = (await res.json()) as CardDb;
      this.db = { ...bundled, source: 'bundled' };
    } catch (err) {
      this.db = { cards: [], fetchedAt: new Date(0).toISOString(), source: 'bundled' };
      this.refreshState = {
        status: 'error',
        message: `Failed to load bundled card DB: ${(err as Error).message}`
      };
    }
  }

  async refreshFromApi(): Promise<void> {
    this.refreshState = { status: 'loading' };
    try {
      const all: Card[] = [];
      let page = 1;
      const PAGE_SIZE = 100;
      // First page
      const firstRes = await fetch(`https://api.riftcodex.com/cards?page=1&size=${PAGE_SIZE}`);
      if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`);
      const firstData = await firstRes.json();
      const firstItems: Card[] = firstData.items ?? firstData.data ?? firstData.cards ?? [];
      const total: number = firstData.total ?? firstData.count ?? firstItems.length;
      all.push(...firstItems);
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      for (page = 2; page <= totalPages; page++) {
        const r = await fetch(`https://api.riftcodex.com/cards?page=${page}&size=${PAGE_SIZE}`);
        if (!r.ok) throw new Error(`HTTP ${r.status} page ${page}`);
        const d = await r.json();
        all.push(...((d.items ?? d.data ?? d.cards ?? []) as Card[]));
      }
      const next: CardDb = {
        cards: all,
        fetchedAt: new Date().toISOString(),
        source: 'api'
      };
      this.db = next;
      safeWriteCache(next);
      this.refreshState = { status: 'idle' };
    } catch (err) {
      this.refreshState = {
        status: 'error',
        message: `Refresh failed: ${(err as Error).message}`
      };
    }
  }
}

export const cardStore = new CardStore();
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cards/store.svelte.ts
git commit -m "feat(cards): reactive store with localStorage cache and API refresh"
```

---

## Task 6: Deck and parser type definitions

**Files:**
- Create: `src/lib/parser/types.ts`

- [ ] **Step 1: Implement types**

```ts
export type Zone =
  | 'legend'
  | 'champion'
  | 'main'
  | 'sideboard'
  | 'battlefields'
  | 'runes';

export const ALL_ZONES: Zone[] = [
  'legend',
  'champion',
  'main',
  'sideboard',
  'battlefields',
  'runes'
];

export type DeckEntry = {
  count: number;
  cardName: string;
  cardId?: string;
  raw: string;
};

export type Deck = {
  id: string;
  name: string;
  source: 'text' | 'json';
  zones: Record<Zone, DeckEntry[]>;
  warnings: string[];
};

export function emptyZones(): Record<Zone, DeckEntry[]> {
  return {
    legend: [],
    champion: [],
    main: [],
    sideboard: [],
    battlefields: [],
    runes: []
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/parser/types.ts
git commit -m "feat(parser): Zone, DeckEntry, Deck types"
```

---

## Task 7: Text parser

**Files:**
- Create: `src/lib/parser/text-parser.ts`, `tests/parser/text-parser.test.ts`, `tests/fixtures/synthetic_deck.txt`, `tests/fixtures/another_synthetic_deck.txt`

- [ ] **Step 1: Copy fixtures**

```bash
cp decks/synthetic_deck.txt tests/fixtures/synthetic_deck.txt
cp decks/another_synthetic_deck.txt tests/fixtures/another_synthetic_deck.txt
```

- [ ] **Step 2: Write failing test**

`tests/parser/text-parser.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseText } from '../../src/lib/parser/text-parser.ts';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf8');
}

describe('parseText', () => {
  it('parses zones, counts, and names', () => {
    const deck = parseText(fixture('synthetic_deck.txt'), 'synthetic_deck.txt');
    expect(deck.name).toBe('Synthetic Deck');
    expect(deck.source).toBe('text');
    expect(deck.zones.legend).toEqual([
      expect.objectContaining({ count: 1, cardName: 'Diana, Scorn of the Moon' })
    ]);
    expect(deck.zones.champion).toEqual([
      expect.objectContaining({ count: 1, cardName: 'Diana, Lunari' })
    ]);
    const mainNames = deck.zones.main.map((e) => e.cardName);
    expect(mainNames).toContain('Stupefy');
    expect(mainNames).toContain('Ravenbloom Student');
    expect(deck.zones.battlefields.length).toBeGreaterThan(0);
    expect(deck.zones.runes.length).toBeGreaterThan(0);
    expect(deck.zones.sideboard.length).toBeGreaterThan(0);
  });

  it('strips parenthetical set codes from card names', () => {
    const text = `Legend:\n1 Diana, Scorn of the Moon (UNL-197)\n`;
    const deck = parseText(text, 'x.txt');
    expect(deck.zones.legend[0].cardName).toBe('Diana, Scorn of the Moon');
    expect(deck.zones.legend[0].raw).toBe('1 Diana, Scorn of the Moon (UNL-197)');
  });

  it('skips junk and unrecognized lines, recording them as warnings', () => {
    const text = `Junk header\n\nLegend:\n1 Diana, Scorn of the Moon\nnot-a-card-line\n`;
    const deck = parseText(text, 'x.txt');
    expect(deck.zones.legend).toHaveLength(1);
    expect(deck.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('uses filename stem (title-cased) as deck name', () => {
    const deck = parseText(`Legend:\n1 X\n`, 'another_synthetic_deck.txt');
    expect(deck.name).toBe('Another Synthetic Deck');
  });

  it('handles extra whitespace and blank lines', () => {
    const text = `\n\nLegend:\n   1   Diana, Scorn of the Moon   \n\n`;
    const deck = parseText(text, 'x.txt');
    expect(deck.zones.legend[0].count).toBe(1);
    expect(deck.zones.legend[0].cardName).toBe('Diana, Scorn of the Moon');
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npx vitest run tests/parser/text-parser.test.ts
```

Expected: FAIL — `parseText` does not exist.

- [ ] **Step 4: Implement `src/lib/parser/text-parser.ts`**

```ts
import { emptyZones, type Deck, type Zone } from './types.ts';

const HEADER_TO_ZONE: Record<string, Zone> = {
  legend: 'legend',
  champion: 'champion',
  maindeck: 'main',
  'main deck': 'main',
  sideboard: 'sideboard',
  battlefields: 'battlefields',
  runes: 'runes'
};

const HEADER_RE = /^([A-Za-z][A-Za-z ]*):\s*$/;
const CARD_RE = /^\s*(\d+)\s+(.+?)\s*$/;
const PAREN_SET_RE = /\s*\(([A-Z]{2,5}-\d{2,4})\)\s*$/;

function deckNameFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  return stem
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function uuid(): string {
  // Crypto-randomized; works in browsers and Node 19+.
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function parseText(text: string, filename: string): Deck {
  const deck: Deck = {
    id: uuid(),
    name: deckNameFromFilename(filename),
    source: 'text',
    zones: emptyZones(),
    warnings: []
  };

  let zone: Zone | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;
    if (!line.trim()) continue;

    const headerMatch = line.match(HEADER_RE);
    if (headerMatch) {
      const key = headerMatch[1].trim().toLowerCase();
      const z = HEADER_TO_ZONE[key];
      if (z) {
        zone = z;
        continue;
      }
      deck.warnings.push(`Unknown section header: ${line}`);
      continue;
    }

    const cardMatch = line.match(CARD_RE);
    if (cardMatch && zone) {
      const count = Number(cardMatch[1]);
      let name = cardMatch[2].trim();
      const paren = name.match(PAREN_SET_RE);
      let cardId: string | undefined;
      if (paren) {
        cardId = paren[1];
        name = name.replace(PAREN_SET_RE, '').trim();
      }
      deck.zones[zone].push({ count, cardName: name, cardId, raw: line.trim() });
      continue;
    }

    deck.warnings.push(`Unparsed line: ${line}`);
  }

  return deck;
}
```

- [ ] **Step 5: Run test, verify pass**

```bash
npx vitest run tests/parser/text-parser.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/text-parser.ts tests/parser/text-parser.test.ts tests/fixtures/
git commit -m "feat(parser): text-format parser with zone/header detection"
```

---

## Task 8: JSON parser

**Files:**
- Create: `src/lib/parser/json-parser.ts`, `tests/parser/json-parser.test.ts`, `tests/fixtures/synthetic_tournament.json`

- [ ] **Step 1: Create fixture `tests/fixtures/synthetic_tournament.json`**

```json
{
  "metadata": { "name": "Sample Tournament Deck", "author": "Anon" },
  "deck": {
    "Main Board": [
      { "id": "OGN-095", "count": "3" },
      { "id": "UNL-198", "count": "3" }
    ],
    "Side Board": [
      { "id": "OGN-201", "count": "2" }
    ]
  }
}
```

- [ ] **Step 2: Write failing test**

`tests/parser/json-parser.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseJson } from '../../src/lib/parser/json-parser.ts';
import type { Card } from '../../src/lib/cards/types.ts';
import { createResolver } from '../../src/lib/cards/resolver.ts';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf8');
}

const cards: Card[] = [
  { id: 'OGN-095', name: 'Stupefy' },
  { id: 'UNL-198', name: 'Ravenbloom Student' }
];

describe('parseJson', () => {
  it('parses Main Board and Side Board with id resolution', () => {
    const deck = parseJson(fixture('synthetic_tournament.json'), 'synthetic_tournament.json', createResolver(cards));
    expect(deck.name).toBe('Sample Tournament Deck');
    expect(deck.source).toBe('json');
    expect(deck.zones.main).toEqual([
      expect.objectContaining({ count: 3, cardId: 'OGN-095', cardName: 'Stupefy' }),
      expect.objectContaining({ count: 3, cardId: 'UNL-198', cardName: 'Ravenbloom Student' })
    ]);
    expect(deck.zones.sideboard).toEqual([
      expect.objectContaining({ count: 2, cardId: 'OGN-201' })
    ]);
  });

  it('falls back to filename stem when metadata.name missing', () => {
    const json = JSON.stringify({ deck: { 'Main Board': [], 'Side Board': [] } });
    const deck = parseJson(json, 'cool_deck.json', createResolver([]));
    expect(deck.name).toBe('Cool Deck');
  });

  it('preserves raw id when not resolvable', () => {
    const deck = parseJson(fixture('synthetic_tournament.json'), 'synthetic_tournament.json', createResolver(cards));
    const unresolved = deck.zones.sideboard[0];
    expect(unresolved.cardId).toBe('OGN-201');
    expect(unresolved.cardName).toBe('OGN-201');
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npx vitest run tests/parser/json-parser.test.ts
```

Expected: FAIL — `parseJson` does not exist.

- [ ] **Step 4: Implement `src/lib/parser/json-parser.ts`**

```ts
import { emptyZones, type Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';

type RawJsonDeck = {
  metadata?: { name?: string; author?: string };
  deck?: {
    'Main Board'?: Array<{ id: string; count: string | number }>;
    'Side Board'?: Array<{ id: string; count: string | number }>;
  };
};

function deckNameFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  return stem
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function uuid(): string {
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function parseJson(text: string, filename: string, resolver: Resolver): Deck {
  let raw: RawJsonDeck;
  try {
    raw = JSON.parse(text) as RawJsonDeck;
  } catch (e) {
    throw new Error(`Invalid JSON in ${filename}: ${(e as Error).message}`);
  }

  const deck: Deck = {
    id: uuid(),
    name: raw.metadata?.name ?? deckNameFromFilename(filename),
    source: 'json',
    zones: emptyZones(),
    warnings: []
  };

  const mainBoard = raw.deck?.['Main Board'] ?? [];
  const sideBoard = raw.deck?.['Side Board'] ?? [];

  for (const entry of mainBoard) {
    const card = resolver.byId(entry.id);
    deck.zones.main.push({
      count: Number(entry.count),
      cardId: entry.id,
      cardName: card?.name ?? entry.id,
      raw: `${entry.count} ${entry.id}`
    });
    if (!card) deck.warnings.push(`Unresolved id: ${entry.id}`);
  }
  for (const entry of sideBoard) {
    const card = resolver.byId(entry.id);
    deck.zones.sideboard.push({
      count: Number(entry.count),
      cardId: entry.id,
      cardName: card?.name ?? entry.id,
      raw: `${entry.count} ${entry.id}`
    });
    if (!card) deck.warnings.push(`Unresolved id: ${entry.id}`);
  }

  return deck;
}
```

- [ ] **Step 5: Run test, verify pass**

```bash
npx vitest run tests/parser/json-parser.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/json-parser.ts tests/parser/json-parser.test.ts tests/fixtures/synthetic_tournament.json
git commit -m "feat(parser): JSON tournament-format parser"
```

---

## Task 9: Parser dispatch (file → Deck)

**Files:**
- Create: `src/lib/parser/index.ts`

- [ ] **Step 1: Implement dispatch**

```ts
import type { Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';
import { parseText } from './text-parser.ts';
import { parseJson } from './json-parser.ts';

export type ParseResult =
  | { ok: true; deck: Deck }
  | { ok: false; filename: string; error: string };

export async function parseFile(file: File, resolver: Resolver): Promise<ParseResult> {
  const text = await file.text();
  const filename = file.name;
  const isJson = filename.toLowerCase().endsWith('.json') || text.trimStart().startsWith('{');
  try {
    const deck = isJson ? parseJson(text, filename, resolver) : parseText(text, filename);
    return { ok: true, deck };
  } catch (e) {
    return { ok: false, filename, error: (e as Error).message };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/parser/index.ts
git commit -m "feat(parser): unified parseFile dispatch"
```

---

## Task 10: Decks state (add / remove / reorder / search / sort / filter)

**Files:**
- Create: `src/lib/state/decks.svelte.ts`

- [ ] **Step 1: Implement state**

```ts
import type { Deck } from '../parser/types.ts';

export type SortMode = 'alpha' | 'presence' | 'total';

class DecksState {
  decks = $state<Deck[]>([]);
  search = $state('');
  sort = $state<SortMode>('presence');
  /** id of a deck to focus the rows on (still shows other deck columns); undefined = no filter */
  deckFilter = $state<string | undefined>(undefined);

  add(deck: Deck) {
    const existingIdx = this.decks.findIndex((d) => d.name === deck.name);
    if (existingIdx >= 0) {
      this.decks[existingIdx] = deck;
    } else {
      this.decks = [...this.decks, deck];
    }
  }

  remove(id: string) {
    this.decks = this.decks.filter((d) => d.id !== id);
    if (this.deckFilter === id) this.deckFilter = undefined;
  }

  move(id: string, toIndex: number) {
    const fromIndex = this.decks.findIndex((d) => d.id === id);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= this.decks.length) return;
    const next = [...this.decks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    this.decks = next;
  }

  clear() {
    this.decks = [];
  }
}

export const decksState = new DecksState();
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/state/decks.svelte.ts
git commit -m "feat(state): decks state with add/remove/reorder and view filters"
```

---

## Task 11: Table derivation (decks → main/sideboard rows)

**Files:**
- Create: `src/lib/state/derivation.ts`, `tests/state/derivation.test.ts`

- [ ] **Step 1: Write failing test**

`tests/state/derivation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Deck } from '../../src/lib/parser/types.ts';
import { emptyZones } from '../../src/lib/parser/types.ts';
import { deriveRows } from '../../src/lib/state/derivation.ts';

function makeDeck(name: string, mainEntries: Array<[number, string]>, sideEntries: Array<[number, string]> = []): Deck {
  const zones = emptyZones();
  for (const [count, cardName] of mainEntries) zones.main.push({ count, cardName, raw: `${count} ${cardName}` });
  for (const [count, cardName] of sideEntries) zones.sideboard.push({ count, cardName, raw: `${count} ${cardName}` });
  return { id: name, name, source: 'text', zones, warnings: [] };
}

describe('deriveRows', () => {
  it('produces one row per distinct card per section with per-deck counts', () => {
    const decks: Deck[] = [
      makeDeck('A', [[3, 'Stupefy'], [2, 'Moonfall']]),
      makeDeck('B', [[3, 'Stupefy'], [1, 'Eclipse']])
    ];
    const { mainRows, sideRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: undefined });
    expect(sideRows).toEqual([]);
    const stupefy = mainRows.find((r) => r.cardName === 'Stupefy');
    expect(stupefy).toBeDefined();
    expect(stupefy!.countsPerDeck).toEqual([3, 3]);
    expect(stupefy!.presence).toBe(2);
    expect(stupefy!.totalCopies).toBe(6);
    expect(stupefy!.isCore).toBe(true);
    const moonfall = mainRows.find((r) => r.cardName === 'Moonfall')!;
    expect(moonfall.countsPerDeck).toEqual([2, 0]);
    expect(moonfall.isCore).toBe(false);
  });

  it('computes core per section independently (main vs sideboard)', () => {
    const decks = [
      makeDeck('A', [[3, 'X']], [[1, 'Y']]),
      makeDeck('B', [[3, 'X']], [[1, 'Z']])
    ];
    const { mainRows, sideRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: undefined });
    expect(mainRows[0].cardName).toBe('X');
    expect(mainRows[0].isCore).toBe(true);
    const y = sideRows.find((r) => r.cardName === 'Y')!;
    expect(y.isCore).toBe(false);
  });

  it('alpha sort orders rows A–Z', () => {
    const decks = [makeDeck('A', [[1, 'Banana'], [1, 'Apple']])];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: undefined });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Apple', 'Banana']);
  });

  it('presence sort orders by presence desc, then total desc', () => {
    const decks = [
      makeDeck('A', [[1, 'Solo'], [3, 'Shared']]),
      makeDeck('B', [[2, 'Shared']])
    ];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'presence', deckFilter: undefined });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Shared', 'Solo']);
  });

  it('total sort orders by total copies desc', () => {
    const decks = [makeDeck('A', [[3, 'Many'], [1, 'Few']])];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'total', deckFilter: undefined });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Many', 'Few']);
  });

  it('search filters rows by case-insensitive substring on name', () => {
    const decks = [makeDeck('A', [[1, 'Stupefy'], [1, 'Moonfall']])];
    const { mainRows } = deriveRows(decks, { search: 'STUP', sort: 'alpha', deckFilter: undefined });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Stupefy']);
  });

  it('deckFilter restricts rows to those present in the chosen deck', () => {
    const decks = [
      makeDeck('A', [[3, 'OnlyInA']]),
      makeDeck('B', [[3, 'OnlyInB']])
    ];
    decks[0].id = 'deck-A';
    decks[1].id = 'deck-B';
    const { mainRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: 'deck-A' });
    expect(mainRows.map((r) => r.cardName)).toEqual(['OnlyInA']);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run tests/state/derivation.test.ts
```

Expected: FAIL — `deriveRows` does not exist.

- [ ] **Step 3: Implement `src/lib/state/derivation.ts`**

```ts
import type { Deck } from '../parser/types.ts';
import type { SortMode } from './decks.svelte.ts';

export type TableRow = {
  cardName: string;
  cardId?: string;
  countsPerDeck: number[];
  totalCopies: number;
  presence: number;
  isCore: boolean;
  maxInRow: number;
};

export type DeriveOptions = {
  search: string;
  sort: SortMode;
  deckFilter: string | undefined;
};

export type DerivedTable = {
  mainRows: TableRow[];
  sideRows: TableRow[];
};

function buildRows(
  decks: Deck[],
  zone: 'main' | 'sideboard',
  options: DeriveOptions
): TableRow[] {
  const filterIdx = options.deckFilter
    ? decks.findIndex((d) => d.id === options.deckFilter)
    : -1;

  // 1. collect distinct card names → cardId hint
  const nameToId = new Map<string, string | undefined>();
  for (const d of decks) {
    for (const e of d.zones[zone]) {
      if (!nameToId.has(e.cardName)) nameToId.set(e.cardName, e.cardId);
    }
  }

  // 2. build rows
  const rows: TableRow[] = [];
  for (const [cardName, cardId] of nameToId) {
    const counts = decks.map((d) => {
      const entry = d.zones[zone].find((e) => e.cardName === cardName);
      return entry?.count ?? 0;
    });
    const presence = counts.filter((c) => c > 0).length;
    const totalCopies = counts.reduce((a, b) => a + b, 0);
    const maxInRow = Math.max(0, ...counts);
    const isCore = decks.length > 0 && presence === decks.length;
    rows.push({ cardName, cardId, countsPerDeck: counts, totalCopies, presence, isCore, maxInRow });
  }

  // 3. apply search
  let filtered = rows;
  if (options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter((r) => r.cardName.toLowerCase().includes(q));
  }

  // 4. apply deckFilter
  if (filterIdx >= 0) {
    filtered = filtered.filter((r) => r.countsPerDeck[filterIdx] > 0);
  }

  // 5. sort
  switch (options.sort) {
    case 'alpha':
      filtered.sort((a, b) => a.cardName.localeCompare(b.cardName));
      break;
    case 'presence':
      filtered.sort(
        (a, b) => b.presence - a.presence || b.totalCopies - a.totalCopies || a.cardName.localeCompare(b.cardName)
      );
      break;
    case 'total':
      filtered.sort(
        (a, b) => b.totalCopies - a.totalCopies || a.cardName.localeCompare(b.cardName)
      );
      break;
  }

  return filtered;
}

export function deriveRows(decks: Deck[], options: DeriveOptions): DerivedTable {
  return {
    mainRows: buildRows(decks, 'main', options),
    sideRows: buildRows(decks, 'sideboard', options)
  };
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/state/derivation.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/state/derivation.ts tests/state/derivation.test.ts
git commit -m "feat(state): table derivation with sort/search/deckFilter"
```

---

## Task 12: Domain accent mapping

**Files:**
- Create: `src/lib/theme/domains.ts`

- [ ] **Step 1: Implement mapping**

```ts
import type { Deck } from '../parser/types.ts';

// Order is also the tie-break order for "dominant" domain.
export const DOMAIN_ORDER = ['Body', 'Chaos', 'Mind', 'Calm', 'Order', 'Fury'] as const;
export type Domain = (typeof DOMAIN_ORDER)[number];

// Placeholder palette; final values selected during the frontend-design pass.
export const DOMAIN_ACCENT: Record<Domain, string> = {
  Body: '#c84d3b',
  Chaos: '#7a3b9a',
  Mind: '#3b6dc8',
  Calm: '#4ba3c4',
  Order: '#c9a96b',
  Fury: '#c2456b'
};

const NEUTRAL = '#7d808a';

function classifyRune(name: string): Domain | undefined {
  for (const d of DOMAIN_ORDER) {
    if (name.toLowerCase().startsWith(d.toLowerCase())) return d;
  }
  return undefined;
}

export function dominantDomain(deck: Deck): Domain | undefined {
  const totals: Record<string, number> = {};
  for (const e of deck.zones.runes) {
    const d = classifyRune(e.cardName);
    if (!d) continue;
    totals[d] = (totals[d] ?? 0) + e.count;
  }
  let best: { domain: Domain; total: number } | undefined;
  for (const d of DOMAIN_ORDER) {
    const t = totals[d] ?? 0;
    if (t > 0 && (!best || t > best.total)) best = { domain: d, total: t };
  }
  return best?.domain;
}

export function deckAccent(deck: Deck): string {
  const d = dominantDomain(deck);
  return d ? DOMAIN_ACCENT[d] : NEUTRAL;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/theme/domains.ts
git commit -m "feat(theme): rune-domain accent mapping"
```

---

## Task 13: App shell and store bootstrap

**Files:**
- Modify: `src/routes/+layout.svelte`, `src/routes/+page.svelte`

- [ ] **Step 1: Update `src/routes/+layout.svelte` to bootstrap card store**

```svelte
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { cardStore } from '$lib/cards/store.svelte.ts';
  let { children } = $props();
  onMount(() => {
    cardStore.loadInitial();
  });
</script>

{@render children()}
```

- [ ] **Step 2: Update `src/routes/+page.svelte` shell**

```svelte
<script lang="ts">
  export const prerender = true;
  import DeckUploader from '$lib/components/DeckUploader.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import MetaPanel from '$lib/components/MetaPanel.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import { decksState } from '$lib/state/decks.svelte.ts';
</script>

<main>
  <header>
    <h1>Riftbound Decklist Analyser</h1>
  </header>

  <DeckUploader />

  {#if decksState.decks.length > 0}
    <MetaPanel />
    <Toolbar />
    <ComparisonTable />
  {:else}
    <p class="empty">Drop deck files to begin.</p>
  {/if}

  <Toaster />
</main>

<style>
  main { max-width: 1400px; margin: 0 auto; padding: 1rem; }
  .empty { opacity: 0.6; padding: 2rem 0; }
</style>
```

- [ ] **Step 3: Verify build still works (components are stubs next; this is just to check imports resolve once stubs exist)**

We'll verify after the next task creates the component stubs.

---

## Task 14: Stub all UI components so the app boots

**Files:**
- Create stubs: `src/lib/components/DeckUploader.svelte`, `Toolbar.svelte`, `ComparisonTable.svelte`, `CardRow.svelte`, `CardDetail.svelte`, `MetaPanel.svelte`, `Toaster.svelte`

This task creates minimal placeholders. Real implementations follow in tasks 15–21. Stubs let the app compile and dev-serve immediately.

- [ ] **Step 1: Create `src/lib/components/DeckUploader.svelte`**

```svelte
<script lang="ts">
  // stub
</script>

<div class="uploader">DeckUploader (stub)</div>

<style>
  .uploader { border: 1px dashed #444; padding: 1rem; border-radius: 8px; }
</style>
```

- [ ] **Step 2: Create `src/lib/components/Toolbar.svelte`**

```svelte
<script lang="ts">
  // stub
</script>

<div class="toolbar">Toolbar (stub)</div>
```

- [ ] **Step 3: Create `src/lib/components/ComparisonTable.svelte`**

```svelte
<script lang="ts">
  // stub
</script>

<div class="table">ComparisonTable (stub)</div>
```

- [ ] **Step 4: Create `src/lib/components/CardRow.svelte`**

```svelte
<script lang="ts">
  let { row } = $props<{ row: { cardName: string } }>();
</script>

<div>{row.cardName} (stub row)</div>
```

- [ ] **Step 5: Create `src/lib/components/CardDetail.svelte`**

```svelte
<script lang="ts">
  let { cardName } = $props<{ cardName: string }>();
</script>

<div>Card detail for {cardName} (stub)</div>
```

- [ ] **Step 6: Create `src/lib/components/MetaPanel.svelte`**

```svelte
<script lang="ts">
  // stub
</script>

<div class="meta">MetaPanel (stub)</div>
```

- [ ] **Step 7: Create `src/lib/components/Toaster.svelte`**

```svelte
<script lang="ts">
  // stub
</script>
```

- [ ] **Step 8: Boot the dev server, confirm the page renders**

```bash
npm run dev
```

Open `http://localhost:5173/`. Expected: the page shows the heading and "Drop deck files to begin." text. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add src/routes/ src/lib/components/
git commit -m "feat(ui): app shell + component stubs"
```

---

## Task 15: DeckUploader — drag-and-drop + file picker (and real Toaster)

**Files:**
- Create: `src/lib/components/toaster-store.svelte.ts`
- Modify: `src/lib/components/Toaster.svelte`, `src/lib/components/DeckUploader.svelte`

In Svelte 5, runes (`$state`) must live in `.svelte` components or `.svelte.ts` modules. Module-scoped state used by multiple components belongs in a `.svelte.ts` file.

- [ ] **Step 1: Create `src/lib/components/toaster-store.svelte.ts`**

```ts
export type Toast = { id: number; kind: 'info' | 'error'; message: string };

let nextId = 1;
const toasts = $state<Toast[]>([]);

export function getToasts(): Toast[] {
  return toasts;
}

export function addToast(t: Omit<Toast, 'id'>): void {
  const id = nextId++;
  toasts.push({ ...t, id });
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === id);
    if (i >= 0) toasts.splice(i, 1);
  }, 5000);
}
```

- [ ] **Step 2: Replace `src/lib/components/Toaster.svelte`**

```svelte
<script lang="ts">
  import { getToasts } from './toaster-store.svelte.ts';
  const toasts = getToasts();
</script>

<div class="toaster">
  {#each toasts as t (t.id)}
    <div class="toast" class:error={t.kind === 'error'}>{t.message}</div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
  }
  .toast {
    background: #1a1c22;
    color: #e8e8ee;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid #2a2d35;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    max-width: 400px;
  }
  .toast.error { border-color: #c84d3b; }
</style>
```

- [ ] **Step 3: Replace `src/lib/components/DeckUploader.svelte`**

```svelte
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
```

- [ ] **Step 4: Manually verify in dev server**

```bash
npm run dev
```

Drop `decks/synthetic_deck.txt` onto the uploader. Confirm the empty-state message disappears and the stub MetaPanel/Toolbar/ComparisonTable render. If you also drop a malformed file (e.g., a random `.txt` with garbage), confirm a red toast appears bottom-right and disappears after ~5s. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/toaster-store.svelte.ts src/lib/components/Toaster.svelte src/lib/components/DeckUploader.svelte
git commit -m "feat(ui): DeckUploader + Toaster with shared rune-backed store"
```

---

## Task 16: Toolbar — search, sort, deck filter, refresh DB

**Files:**
- Modify: `src/lib/components/Toolbar.svelte`

- [ ] **Step 1: Implement Toolbar**

```svelte
<script lang="ts">
  import { decksState, type SortMode } from '$lib/state/decks.svelte.ts';
  import { cardStore } from '$lib/cards/store.svelte.ts';

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'presence', label: 'Presence' },
    { value: 'alpha', label: 'A–Z' },
    { value: 'total', label: 'Total copies' }
  ];
</script>

<div class="toolbar">
  <input
    type="search"
    placeholder="Search cards…"
    bind:value={decksState.search}
    aria-label="Search cards"
  />
  <label>
    Sort
    <select bind:value={decksState.sort}>
      {#each sortOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </label>
  <label>
    Filter to deck
    <select bind:value={decksState.deckFilter}>
      <option value={undefined}>All decks</option>
      {#each decksState.decks as d (d.id)}
        <option value={d.id}>{d.name}</option>
      {/each}
    </select>
  </label>
  <button onclick={() => cardStore.refreshFromApi()} disabled={cardStore.refreshState.status === 'loading'}>
    {cardStore.refreshState.status === 'loading' ? 'Refreshing…' : 'Refresh card DB'}
  </button>
  {#if cardStore.refreshState.status === 'error'}
    <span class="error">{cardStore.refreshState.message}</span>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
  }
  input[type='search'] { flex: 1 1 200px; }
  .error { color: #c84d3b; font-size: 0.85em; }
</style>
```

- [ ] **Step 2: Manually verify in dev server**

Drop a deck file. Type in the search box → no errors thrown (table still stub). Change sort/filter selects. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Toolbar.svelte
git commit -m "feat(ui): Toolbar with search/sort/filter and refresh button"
```

---

## Task 17: ComparisonTable — main + sideboard sections

**Files:**
- Modify: `src/lib/components/ComparisonTable.svelte`, `src/lib/components/CardRow.svelte`

- [ ] **Step 1: Implement ComparisonTable**

```svelte
<script lang="ts">
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { deriveRows } from '$lib/state/derivation.ts';
  import { deckAccent } from '$lib/theme/domains.ts';
  import CardRow from './CardRow.svelte';

  const derived = $derived(
    deriveRows(decksState.decks, {
      search: decksState.search,
      sort: decksState.sort,
      deckFilter: decksState.deckFilter
    })
  );

  let expandedKey = $state<string | undefined>(undefined);

  function rowKey(section: 'main' | 'side', cardName: string): string {
    return `${section}:${cardName}`;
  }

  function toggle(key: string) {
    expandedKey = expandedKey === key ? undefined : key;
  }

  let dragId = $state<string | undefined>(undefined);

  function onDragStart(id: string) { dragId = id; }
  function onDrop(e: DragEvent, targetIdx: number) {
    e.preventDefault();
    if (dragId) decksState.move(dragId, targetIdx);
    dragId = undefined;
  }
  function onDragOver(e: DragEvent) { e.preventDefault(); }
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th class="card-col">Card</th>
        {#each decksState.decks as deck, i (deck.id)}
          <th
            class="deck-col"
            style="--accent: {deckAccent(deck)}"
            draggable="true"
            ondragstart={() => onDragStart(deck.id)}
            ondragover={onDragOver}
            ondrop={(e) => onDrop(e, i)}
          >
            <div class="deck-head">
              <span class="deck-name">{deck.name}</span>
              <button class="remove" onclick={() => decksState.remove(deck.id)} aria-label="Remove deck">×</button>
            </div>
            {#if deck.zones.champion[0]}
              <div class="champion">{deck.zones.champion[0].cardName}</div>
            {/if}
          </th>
        {/each}
        <th class="max-col">Max</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-header"><td colspan={decksState.decks.length + 2}>Main Deck</td></tr>
      {#each derived.mainRows as row (row.cardName)}
        <CardRow
          {row}
          accents={decksState.decks.map((d) => deckAccent(d))}
          expanded={expandedKey === rowKey('main', row.cardName)}
          onToggle={() => toggle(rowKey('main', row.cardName))}
        />
      {/each}

      {#if derived.sideRows.length > 0}
        <tr class="section-header sideboard"><td colspan={decksState.decks.length + 2}>Sideboard</td></tr>
        {#each derived.sideRows as row (row.cardName)}
          <CardRow
            {row}
            accents={decksState.decks.map((d) => deckAccent(d))}
            expanded={expandedKey === rowKey('side', row.cardName)}
            onToggle={() => toggle(rowKey('side', row.cardName))}
          />
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
  th, :global(td) { padding: 0.4rem 0.6rem; text-align: left; border-bottom: 1px solid #1f2128; }
  th { background: #14161c; position: sticky; top: 0; }
  .card-col { min-width: 220px; }
  .deck-col { min-width: 110px; border-bottom: 2px solid var(--accent, #555); }
  .max-col { width: 60px; text-align: right; }
  .deck-head { display: flex; align-items: center; gap: 0.5rem; }
  .deck-name { flex: 1; }
  .remove { background: transparent; color: #888; border: none; cursor: pointer; font-size: 1.1em; }
  .remove:hover { color: #fff; }
  .champion { font-size: 0.8em; opacity: 0.75; margin-top: 0.15rem; }
  .section-header td {
    background: #11131a;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75em;
    letter-spacing: 0.06em;
    padding: 0.5rem 0.6rem;
  }
  .section-header.sideboard td { border-top: 3px solid #2a2d35; }
</style>
```

- [ ] **Step 2: Implement CardRow**

```svelte
<script lang="ts">
  import type { TableRow } from '$lib/state/derivation.ts';
  import CardDetail from './CardDetail.svelte';

  let { row, accents, expanded, onToggle } = $props<{
    row: TableRow;
    accents: string[];
    expanded: boolean;
    onToggle: () => void;
  }>();

  function bg(count: number, accent: string): string {
    if (count <= 0) return 'transparent';
    const opacity = Math.min(1, count / 3);
    return `color-mix(in srgb, ${accent} ${Math.round(opacity * 100)}%, transparent)`;
  }
</script>

<tr class:core={row.isCore} class:expanded onclick={onToggle}>
  <td class="card-name">
    {#if row.isCore}<span class="dot" aria-hidden="true">●</span>{/if}
    {row.cardName}
  </td>
  {#each row.countsPerDeck as count, i}
    <td class="count" style="background: {bg(count, accents[i])}">
      {count > 0 ? count : '—'}
    </td>
  {/each}
  <td class="max">{row.maxInRow}</td>
</tr>
{#if expanded}
  <tr class="detail-row">
    <td colspan={row.countsPerDeck.length + 2}>
      <CardDetail cardName={row.cardName} cardId={row.cardId} />
    </td>
  </tr>
{/if}

<style>
  tr { cursor: pointer; }
  tr:hover { background: rgba(255,255,255,0.02); }
  tr.core { background: rgba(255,255,255,0.025); }
  tr.expanded { background: rgba(255,255,255,0.05); }
  .dot { color: #c9a96b; margin-right: 0.35em; }
  .count { text-align: center; font-variant-numeric: tabular-nums; }
  .max { text-align: right; opacity: 0.7; }
  .detail-row td { background: #0f1116; padding: 1rem; }
</style>
```

- [ ] **Step 3: Manually verify in dev server**

Drop two `.txt` decks. Confirm the table renders with deck columns, counts, "—" for absent, the dot for core cards, sideboard section appears below main. Click a row, the detail row toggles. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ComparisonTable.svelte src/lib/components/CardRow.svelte
git commit -m "feat(ui): comparison table with sections, accents, expand-on-click"
```

---

## Task 18: CardDetail — image + fields from card DB

**Files:**
- Modify: `src/lib/components/CardDetail.svelte`

- [ ] **Step 1: Implement CardDetail**

```svelte
<script lang="ts">
  import { cardStore } from '$lib/cards/store.svelte.ts';

  let { cardName, cardId } = $props<{ cardName: string; cardId?: string }>();

  const card = $derived.by(() => {
    const r = cardStore.resolver;
    if (!r) return undefined;
    return (cardId && r.byId(cardId)) || r.byName(cardName);
  });
</script>

{#if !card}
  <div class="missing">
    <strong>{cardName}</strong> — no match in card DB.
    {#if cardId}<span class="id"> ({cardId})</span>{/if}
  </div>
{:else}
  <div class="detail">
    {#if card.image_url}
      <img src={card.image_url} alt={card.accessibility_text ?? card.name} />
    {/if}
    <div class="fields">
      <h3>{card.name}</h3>
      <p class="meta">
        {#if card.type}<span>{card.type}</span>{/if}
        {#if card.rarity}<span>{card.rarity}</span>{/if}
        {#if card.domain}<span>{card.domain}</span>{/if}
        {#if card.energy != null}<span>Energy {card.energy}</span>{/if}
        {#if card.power != null}<span>Power {card.power}</span>{/if}
        {#if card.might != null}<span>Might {card.might}</span>{/if}
      </p>
      {#if card.text}<p class="text">{card.text}</p>{/if}
      {#if card.set}<p class="set">{card.set.label} · {card.collector_number ?? card.id}</p>{/if}
      {#if card.tags?.length}
        <p class="tags">{card.tags.join(', ')}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .detail {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 1rem;
    align-items: start;
  }
  img { width: 100%; border-radius: 8px; }
  h3 { margin: 0 0 0.5rem 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 0.5rem; opacity: 0.85; font-size: 0.9em; }
  .meta span {
    background: rgba(255,255,255,0.05);
    border: 1px solid #2a2d35;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }
  .text { white-space: pre-wrap; }
  .set, .tags { font-size: 0.8em; opacity: 0.6; }
  .missing { opacity: 0.75; font-style: italic; }
  .id { opacity: 0.5; font-family: monospace; }
  @media (max-width: 720px) {
    .detail { grid-template-columns: 1fr; }
    img { max-width: 220px; }
  }
</style>
```

- [ ] **Step 2: Manually verify**

Drop a deck. Click a card row. Confirm image (if available) and fields render. Drop a JSON deck whose ids may not resolve to confirm the "no match" path renders. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/CardDetail.svelte
git commit -m "feat(ui): CardDetail with image and resolved fields"
```

---

## Task 19: MetaPanel — Legend, Battlefields, Runes, totals

**Files:**
- Modify: `src/lib/components/MetaPanel.svelte`

- [ ] **Step 1: Implement MetaPanel**

```svelte
<script lang="ts">
  import { decksState } from '$lib/state/decks.svelte.ts';
  import { deckAccent } from '$lib/theme/domains.ts';

  let collapsed = $state(false);

  function totalCount(entries: Array<{ count: number }>): number {
    return entries.reduce((s, e) => s + e.count, 0);
  }
</script>

<section class="meta">
  <button class="header" onclick={() => (collapsed = !collapsed)}>
    {collapsed ? '▸' : '▾'} Deck details
  </button>
  {#if !collapsed}
    <div class="grid">
      {#each decksState.decks as d (d.id)}
        <article class="card" style="--accent: {deckAccent(d)}">
          <h3>{d.name}</h3>
          {#if d.zones.legend[0]}
            <p class="line"><span class="label">Legend:</span> {d.zones.legend[0].cardName}</p>
          {/if}
          {#if d.zones.battlefields.length > 0}
            <p class="line"><span class="label">Battlefields:</span></p>
            <ul>
              {#each d.zones.battlefields as e}
                <li>{e.count} {e.cardName}</li>
              {/each}
            </ul>
          {/if}
          {#if d.zones.runes.length > 0}
            <p class="line"><span class="label">Runes:</span></p>
            <ul>
              {#each d.zones.runes as e}
                <li>{e.count} {e.cardName}</li>
              {/each}
            </ul>
          {/if}
          <p class="totals">
            Main: {totalCount(d.zones.main)} · Sideboard: {totalCount(d.zones.sideboard)}
          </p>
          {#if d.warnings.length > 0}
            <details>
              <summary>{d.warnings.length} warning{d.warnings.length === 1 ? '' : 's'}</summary>
              <ul class="warnings">
                {#each d.warnings as w}<li>{w}</li>{/each}
              </ul>
            </details>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .meta { margin: 1rem 0; }
  .header {
    background: transparent; border: none; color: inherit;
    font: inherit; cursor: pointer; padding: 0.5rem 0; opacity: 0.85;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
  .card {
    border: 1px solid #2a2d35; border-top: 3px solid var(--accent, #555);
    background: #14161c; padding: 0.75rem; border-radius: 6px;
    font-size: 0.9em;
  }
  h3 { margin: 0 0 0.5rem; font-size: 1em; }
  .label { opacity: 0.6; font-size: 0.85em; }
  ul { margin: 0.25rem 0 0.5rem 1rem; padding: 0; }
  .totals { margin-top: 0.5rem; opacity: 0.85; }
  .warnings { font-size: 0.85em; opacity: 0.8; }
</style>
```

- [ ] **Step 2: Manually verify**

Drop two decks. Confirm MetaPanel shows Legend / Battlefields / Runes / Main + Sideboard totals per deck. Toggle collapse.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/MetaPanel.svelte
git commit -m "feat(ui): MetaPanel with Legend/Battlefields/Runes/totals + warnings"
```

---

## Task 20: Final pass — Riftbound visual design via frontend-design skill

This task hands the existing functional UI to the **frontend-design** skill for thematic styling.

**Files (likely to be modified):**
- `src/app.css`
- `src/lib/theme/tokens.css` (created by the skill)
- All `src/lib/components/*.svelte`
- `src/routes/+layout.svelte`, `src/routes/+page.svelte`

**Goal:** Riftbound / League-of-Legends-flavored dark UI that does not look like generic AI styling.

- [ ] **Step 1: Invoke frontend-design with this brief**

Use the `frontend-design` skill with this prompt (verbatim):

> Style the existing Riftbound Decklist Analyser UI. Constraints:
>
> - All component logic, props, state, and structural HTML are FIXED — only modify CSS, tokens, typography, color, layout polish, motion. Do not change Svelte logic.
> - Theme: dark, fantasy/TCG-flavored, distinct from generic AI dashboard aesthetic. Reference cues: Riftbound TCG, League of Legends UI, but original — no copyrighted assets.
> - Use the rune-domain accent colors defined in `src/lib/theme/domains.ts` as deck column accents. Choose final hex values that read well on dark backgrounds and meet WCAG AA contrast for text-on-accent.
> - Write tokens (color, type scale, spacing, radii) into `src/lib/theme/tokens.css`. Refactor inline component styles to consume tokens. Keep component-local styles for layout specifics; tokens for color/type/spacing only.
> - Visual encoding for table cells: opacity = count/3 of the column accent. Core rows (cards in every deck) get a subtle row highlight + accent dot. Sideboard section divider must read as visually heavier than ordinary row borders.
> - Keep tabular numerals on count cells. Keep the table responsive; on narrow viewports, the deck columns may scroll horizontally.
> - Use system or webfont — pick one webfont with strong personality if it adds character. Fall back gracefully.
> - Test on viewports 1440px, 1024px, 768px, 480px.

- [ ] **Step 2: Run all tests after the styling pass**

```bash
npm test
```

Expected: all tests still PASS (style-only changes shouldn't affect logic tests).

- [ ] **Step 3: Verify build still produces a working static site**

```bash
npm run build
npm run preview
```

Expected: preview opens, app renders, dropping decks works end-to-end.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): Riftbound thematic styling via frontend-design"
```

---

## Task 21: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: ALL tests PASS.

- [ ] **Step 2: Type check**

```bash
npm run check
```

Expected: zero errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `dist/` produced, no errors or warnings beyond benign Vite info logs.

- [ ] **Step 4: Smoke test in preview**

```bash
npm run preview
```

Manually exercise:
1. Drop multiple `.txt` decks from `decks/` — they appear as columns.
2. Drop the same file twice — second drop replaces, no duplicate column.
3. Drop a `.json` tournament file — parses and shows in main + sideboard.
4. Search filters rows.
5. Each sort mode reorders correctly.
6. Deck filter narrows rows to the selected deck.
7. Drag a deck-column header to reorder.
8. Click a card row — detail expands inline with image (if resolved).
9. Click "Refresh card DB" — either succeeds or shows a non-blocking error banner; app remains usable.
10. Remove a deck — column disappears, deck filter cleared if it pointed at the removed deck.

- [ ] **Step 5: Commit any small fixes from smoke test, then final tag**

```bash
git add -A
git commit -m "chore: smoke-test fixes" --allow-empty
git tag mvp-1
```

---

## Out of scope (deferred, per spec)

- CSV / image export
- "Highlight cards unique to exactly one deck" (separate from core highlight)
- Side-by-side diff view
- Persistence of uploaded decks across sessions
