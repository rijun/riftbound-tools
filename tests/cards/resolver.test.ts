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
