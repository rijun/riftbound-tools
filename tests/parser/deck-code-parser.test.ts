import { describe, it, expect } from 'vitest';
import { parseDeckCode } from '../../src/lib/parser/deck-code-parser.ts';
import { createResolver } from '../../src/lib/cards/resolver.ts';
import type { Card } from '../../src/lib/cards/types.ts';
import { getCodeFromDeck } from '@piltoverarchive/riftbound-deck-codes';

// Cards crafted to match the README example deck code:
// CIAAAAAAAAAQCAAAA4AACAIAABMQAAILAAAAICIMDMOVOX3AM5UHIAIDAAACO6XYAEAQKAAABX3QDGACUABKIAQAAEBQAAAWDBOQCAQAABMHE
const SAMPLE_CODE =
  'CIAAAAAAAAAQCAAAA4AACAIAABMQAAILAAAAICIMDMOVOX3AM5UHIAIDAAACO6XYAEAQKAAABX3QDGACUABKIAQAAEBQAAAWDBOQCAQAABMHE';

const cards: Card[] = [
  { id: 'm-7',   name: 'Fury Rune',                 collector_number: 7,   set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Rune' } },
  { id: 'm-89',  name: 'Mind Rune',                 collector_number: 89,  set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Rune' } },
  { id: 'm-280', name: 'Grove of the God-Willow',   collector_number: 280, set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Battlefield' } },
  { id: 'm-247', name: "Kai'Sa - Daughter of the Void", collector_number: 247, set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Legend' } },
  { id: 'm-95',  name: 'Stupefy',                   collector_number: 95,  set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Spell' } }
];

describe('parseDeckCode', () => {
  it('decodes the sample code and buckets cards by classification', () => {
    const resolver = createResolver(cards);
    const deck = parseDeckCode(SAMPLE_CODE, 'Sample', resolver);
    expect(deck.name).toBe('Sample');
    expect(deck.source).toBe('code');

    // Runes go to the runes zone
    const runeNames = deck.zones.runes.map((e) => e.cardName).sort();
    expect(runeNames).toContain('Fury Rune');
    expect(runeNames).toContain('Mind Rune');

    // Battlefields go to the battlefields zone
    const battleNames = deck.zones.battlefields.map((e) => e.cardName);
    expect(battleNames).toContain('Grove of the God-Willow');

    // Legend goes to the legend zone
    const legendNames = deck.zones.legend.map((e) => e.cardName);
    expect(legendNames).toContain("Kai'Sa - Daughter of the Void");

    // Spell goes to main
    const mainNames = deck.zones.main.map((e) => e.cardName);
    expect(mainNames).toContain('Stupefy');
  });

  it('falls back to a default name when the user provides none', () => {
    const deck = parseDeckCode(SAMPLE_CODE, '', createResolver(cards));
    expect(deck.name).toBe('Pasted deck');
  });

  it('keeps unresolved codes as raw with a warning', () => {
    const deck = parseDeckCode(SAMPLE_CODE, 'X', createResolver([]));
    expect(deck.warnings.length).toBeGreaterThan(0);
    // Every entry should still have a cardName (the raw code) and a count
    const firstMain = deck.zones.main[0];
    expect(firstMain.cardName).toMatch(/^OGN-\d+$/);
    expect(firstMain.count).toBeGreaterThan(0);
  });

  it('throws a clear error on a malformed deck code', () => {
    expect(() => parseDeckCode('!!! not a code', 'X', createResolver(cards))).toThrow(/Invalid deck code/);
  });

  it('mirrors chosen champion into main deck', () => {
    const champCards: Card[] = [
      { id: 'm-95',  name: 'Stupefy',        collector_number: 95,  set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Spell' } },
      { id: 'm-103', name: 'Diana - Lunari', collector_number: 103, set: { set_id: 'OGN', label: 'Origins' }, classification: { type: 'Unit', supertype: 'Champion' } }
    ];
    const code = getCodeFromDeck(
      [{ cardCode: 'OGN-095', count: 3 }],
      [],
      'OGN-103'
    );
    const deck = parseDeckCode(code, 'D', createResolver(champCards));
    expect(deck.zones.champion).toHaveLength(1);
    expect(deck.zones.champion[0].cardName).toBe('Diana - Lunari');
    const inMain = deck.zones.main.find((e) => e.cardName === 'Diana - Lunari');
    expect(inMain?.count).toBe(1);
  });
});
