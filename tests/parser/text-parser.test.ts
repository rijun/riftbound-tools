import { describe, it, expect } from 'vitest';
import { parseTextList, deckNameFromFilename } from '$lib/parser/text-parser.ts';
import { createResolver } from '$lib/cards/resolver.ts';

const SYNTHETIC_DECK = `Legend:
1 Synthetic Legend

Champion:
1 Synthetic Champion

MainDeck:
3 Synthetic Spell A
2 Synthetic Spell B

Battlefields:
1 Synthetic Battlefield

Runes:
4 Body Rune
4 Mind Rune

Sideboard:
2 Synthetic Sideboard Card
`;

describe('parseTextList', () => {
  it('parses every zone with correct counts and names', () => {
    const deck = parseTextList(SYNTHETIC_DECK, 'Synthetic Deck');
    expect(deck.name).toBe('Synthetic Deck');
    expect(deck.source).toBe('text');
    expect(deck.zones.legend).toEqual([
      expect.objectContaining({ count: 1, cardName: 'Synthetic Legend' })
    ]);
    expect(deck.zones.champion).toEqual([
      expect.objectContaining({ count: 1, cardName: 'Synthetic Champion' })
    ]);
    const mainNames = deck.zones.main.map((e) => e.cardName);
    expect(mainNames).toContain('Synthetic Spell A');
    expect(mainNames).toContain('Synthetic Spell B');
    // Champion is mirrored into main.
    expect(mainNames).toContain('Synthetic Champion');
    expect(deck.zones.battlefields).toHaveLength(1);
    expect(deck.zones.runes.map((e) => e.cardName)).toEqual(['Body Rune', 'Mind Rune']);
    expect(deck.zones.sideboard).toHaveLength(1);
  });

  it('strips parenthetical set codes from card names', () => {
    const text = `Legend:\n1 Diana, Scorn of the Moon (UNL-197)\n`;
    const deck = parseTextList(text, 'X');
    expect(deck.zones.legend[0].cardName).toBe('Diana, Scorn of the Moon');
    expect(deck.zones.legend[0].raw).toBe('1 Diana, Scorn of the Moon (UNL-197)');
  });

  it('skips junk and unrecognized lines, recording them as warnings', () => {
    const text = `Junk header\n\nLegend:\n1 Diana, Scorn of the Moon\nnot-a-card-line\n`;
    const deck = parseTextList(text, 'X');
    expect(deck.zones.legend).toHaveLength(1);
    expect(deck.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('uses the supplied name verbatim', () => {
    const deck = parseTextList(`Legend:\n1 X\n`, 'My Custom Name');
    expect(deck.name).toBe('My Custom Name');
  });

  it('handles extra whitespace and blank lines', () => {
    const text = `\n\nLegend:\n   1   Diana, Scorn of the Moon   \n\n`;
    const deck = parseTextList(text, 'X');
    expect(deck.zones.legend[0].count).toBe(1);
    expect(deck.zones.legend[0].cardName).toBe('Diana, Scorn of the Moon');
  });

  it('canonicalizes card name to DB form when resolver is provided', () => {
    const cards = [{ id: 'mongo-1', name: 'Hwei - Brooding Painter' }];
    const resolver = createResolver(cards);
    const text = 'MainDeck:\n3 Hwei, Brooding Painter\n';
    const deck = parseTextList(text, 'X', resolver);
    expect(deck.zones.main[0].cardName).toBe('Hwei - Brooding Painter');
    expect(deck.zones.main[0].cardId).toBe('mongo-1');
  });

  it('mirrors chosen champion into main deck', () => {
    const text = 'Champion:\n1 Diana, Lunari\nMainDeck:\n3 Stupefy\n';
    const deck = parseTextList(text, 'X');
    expect(deck.zones.champion).toHaveLength(1);
    const inMain = deck.zones.main.find((e) => e.cardName === 'Diana, Lunari');
    expect(inMain?.count).toBe(1);
  });

  it('increments existing main-deck count when champion already listed in main', () => {
    const text = 'Champion:\n1 Diana, Lunari\nMainDeck:\n2 Diana, Lunari\n3 Stupefy\n';
    const deck = parseTextList(text, 'X');
    const inMain = deck.zones.main.find((e) => e.cardName === 'Diana, Lunari');
    expect(inMain?.count).toBe(3);
  });
});

describe('deckNameFromFilename', () => {
  it('strips extension and title-cases tokens split on _ - and space', () => {
    expect(deckNameFromFilename('alpha_beta_gamma_delta.txt')).toBe('Alpha Beta Gamma Delta');
  });

  it('handles dashes and spaces as separators', () => {
    expect(deckNameFromFilename('one two-three_four.txt')).toBe('One Two Three Four');
  });
});