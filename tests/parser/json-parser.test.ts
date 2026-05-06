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
