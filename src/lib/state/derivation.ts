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
  deckFilter: string;
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
