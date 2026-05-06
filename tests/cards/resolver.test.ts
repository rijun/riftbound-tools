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

describe('byShortCode', () => {
  const cards: Card[] = [
    {
      id: 'mongoid-1',
      name: 'Stupefy',
      collector_number: 95,
      set: { set_id: 'OGN', label: 'Origins' }
    },
    {
      id: 'mongoid-2',
      name: 'Vilemaw',
      collector_number: 60,
      set: { set_id: 'UNL', label: 'Unleashed' }
    },
    {
      id: 'mongoid-3',
      name: 'Vilemaw (Alternate Art)',
      collector_number: 60,
      set: { set_id: 'UNL', label: 'Unleashed' },
      metadata: { alternate_art: true }
    }
  ];

  it('resolves a short code to the matching card', () => {
    const r = createResolver(cards);
    expect(r.byShortCode('OGN-095')?.name).toBe('Stupefy');
  });

  it('treats short codes case-insensitively', () => {
    const r = createResolver(cards);
    expect(r.byShortCode('ogn-095')?.name).toBe('Stupefy');
  });

  it('strips leading zeros from the number', () => {
    const r = createResolver(cards);
    // '95' and '095' should map to the same card
    expect(r.byShortCode('OGN-95')?.name).toBe('Stupefy');
  });

  it('prefers the non-alternate-art card when both exist', () => {
    const r = createResolver(cards);
    const v = r.byShortCode('UNL-060');
    expect(v?.name).toBe('Vilemaw');
  });

  it('returns undefined for unknown set+number', () => {
    const r = createResolver(cards);
    expect(r.byShortCode('XXX-999')).toBeUndefined();
  });

  it('returns undefined for malformed codes', () => {
    const r = createResolver(cards);
    expect(r.byShortCode('not a code')).toBeUndefined();
    expect(r.byShortCode('OGN')).toBeUndefined();
  });
});
