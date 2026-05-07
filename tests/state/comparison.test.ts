import { describe, it, expect } from 'vitest';
import {
  buildComparison,
  serialize,
  parseComparison,
  defaultFilename,
  InvalidComparisonError
} from '../../src/lib/state/comparison.ts';
import { emptyZones, type Deck } from '../../src/lib/parser/types.ts';

function makeDeck(name: string): Deck {
  return {
    id: `id-${name}`,
    name,
    source: 'text',
    zones: emptyZones(),
    warnings: []
  };
}

describe('comparison module', () => {
  it('round-trips decks through serialize → parse', () => {
    const original = buildComparison([makeDeck('A'), makeDeck('B')]);
    const text = serialize(original);
    const back = parseComparison(text);
    expect(back.version).toBe(1);
    expect(back.decks.map((d) => d.name)).toEqual(['A', 'B']);
  });

  it('regenerates deck ids on parse so no two imports collide', () => {
    const original = buildComparison([makeDeck('A')]);
    const back1 = parseComparison(serialize(original));
    const back2 = parseComparison(serialize(original));
    expect(back1.decks[0].id).not.toBe(back2.decks[0].id);
    expect(back1.decks[0].id).not.toBe(original.decks[0].id);
  });

  it('rejects non-JSON input', () => {
    expect(() => parseComparison('not json')).toThrow(InvalidComparisonError);
  });

  it('rejects unsupported versions', () => {
    expect(() => parseComparison(JSON.stringify({ version: 2, decks: [] })))
      .toThrow(/Unsupported comparison file version/);
  });

  it('rejects missing decks array', () => {
    expect(() => parseComparison(JSON.stringify({ version: 1 })))
      .toThrow(/Missing or invalid "decks"/);
  });

  it('rejects invalid deck entries', () => {
    expect(() => parseComparison(JSON.stringify({ version: 1, decks: [{ name: 'A' }] })))
      .toThrow(/zones must be an object/);
  });

  it('defaults missing source to text', () => {
    const comp = parseComparison(JSON.stringify({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      decks: [{ name: 'A', zones: emptyZones() }]
    }));
    expect(comp.decks[0].source).toBe('text');
  });

  it('defaults missing warnings to empty array', () => {
    const comp = parseComparison(JSON.stringify({
      version: 1,
      decks: [{ name: 'A', zones: emptyZones() }]
    }));
    expect(comp.decks[0].warnings).toEqual([]);
  });

  it('formats default filenames as comparison-YYYY-MM-DD.json', () => {
    const fn = defaultFilename(new Date('2026-05-07T12:00:00Z'));
    // Asserting the date portion only, since timezone could shift the day at midnight.
    expect(fn).toMatch(/^comparison-2026-05-0[67]\.json$/);
  });
});
