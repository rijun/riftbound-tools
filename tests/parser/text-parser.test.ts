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
