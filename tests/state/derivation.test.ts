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
    const { mainRows, sideRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: '' });
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
    const { mainRows, sideRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: '' });
    expect(mainRows[0].cardName).toBe('X');
    expect(mainRows[0].isCore).toBe(true);
    const y = sideRows.find((r) => r.cardName === 'Y')!;
    expect(y.isCore).toBe(false);
  });

  it('alpha sort orders rows A–Z', () => {
    const decks = [makeDeck('A', [[1, 'Banana'], [1, 'Apple']])];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'alpha', deckFilter: '' });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Apple', 'Banana']);
  });

  it('presence sort orders by presence desc, then total desc', () => {
    const decks = [
      makeDeck('A', [[1, 'Solo'], [3, 'Shared']]),
      makeDeck('B', [[2, 'Shared']])
    ];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'presence', deckFilter: '' });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Shared', 'Solo']);
  });

  it('total sort orders by total copies desc', () => {
    const decks = [makeDeck('A', [[3, 'Many'], [1, 'Few']])];
    const { mainRows } = deriveRows(decks, { search: '', sort: 'total', deckFilter: '' });
    expect(mainRows.map((r) => r.cardName)).toEqual(['Many', 'Few']);
  });

  it('search filters rows by case-insensitive substring on name', () => {
    const decks = [makeDeck('A', [[1, 'Stupefy'], [1, 'Moonfall']])];
    const { mainRows } = deriveRows(decks, { search: 'STUP', sort: 'alpha', deckFilter: '' });
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
