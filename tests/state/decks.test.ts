import { describe, it, expect, beforeEach } from 'vitest';
import { decksState } from '../../src/lib/state/decks.svelte.ts';
import { emptyZones, type Deck } from '../../src/lib/parser/types.ts';

const LS_KEY = 'riftbound:active-comparison';

function makeDeck(name: string): Deck {
  return { id: `id-${name}`, name, source: 'text', zones: emptyZones(), warnings: [] };
}

describe('DecksState persistence', () => {
  beforeEach(() => {
    // localStorage is cleared by the global setup in tests/setup.ts.
    // Reset in-memory state as well.
    decksState.clear();
  });

  it('writes to localStorage after add()', () => {
    decksState.add(makeDeck('A'));
    const raw = localStorage.getItem(LS_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.decks).toHaveLength(1);
    expect(parsed.decks[0].name).toBe('A');
  });

  it('removes the localStorage entry when the last deck is cleared', () => {
    decksState.add(makeDeck('A'));
    decksState.clear();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('restores decks from localStorage on restore()', () => {
    decksState.add(makeDeck('A'));
    decksState.add(makeDeck('B'));
    // Simulate a fresh page load:
    decksState.decks = [];
    decksState.restore();
    expect(decksState.decks.map((d) => d.name)).toEqual(['A', 'B']);
  });

  it('restore() is a no-op when localStorage is empty', () => {
    decksState.restore();
    expect(decksState.decks).toEqual([]);
  });

  it('restore() drops a malformed stored value', () => {
    localStorage.setItem(LS_KEY, '{ invalid json');
    decksState.restore();
    expect(decksState.decks).toEqual([]);
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('replaceAll() writes to localStorage exactly once', () => {
    let writes = 0;
    const realSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (k, v) => { writes++; realSet(k, v); };
    try {
      decksState.replaceAll([makeDeck('A'), makeDeck('B'), makeDeck('C')]);
      expect(writes).toBe(1);
      expect(decksState.decks).toHaveLength(3);
    } finally {
      localStorage.setItem = realSet;
    }
  });
});
