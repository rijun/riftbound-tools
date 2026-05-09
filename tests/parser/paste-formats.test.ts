import { describe, it, expect } from 'vitest';
import {
  parsePaste,
  PASTE_FORMATS,
  UnknownFormatError
} from '../../src/lib/parser/paste-formats.ts';
import { createResolver } from '../../src/lib/cards/resolver.ts';
import type { Card } from '../../src/lib/cards/types.ts';
import { getCodeFromDeck } from '@piltoverarchive/riftbound-deck-codes';

const cards: Card[] = [
  {
    id: 'm-95',
    name: 'Stupefy',
    collector_number: 95,
    set: { set_id: 'OGN', label: 'Origins' },
    classification: { type: 'Spell' }
  },
  {
    id: 'm-103',
    name: 'Diana - Lunari',
    collector_number: 103,
    set: { set_id: 'OGN', label: 'Origins' },
    classification: { type: 'Unit', supertype: 'Champion' }
  }
];

describe('parsePaste', () => {
  it('detects text decklist and dispatches to parseTextList', () => {
    const text = 'MainDeck:\n3 Stupefy\n';
    const deck = parsePaste(text, 'My Deck', createResolver(cards));
    expect(deck.source).toBe('text');
    expect(deck.name).toBe('My Deck');
    expect(deck.zones.main.find((e) => e.cardName === 'Stupefy')?.count).toBe(3);
  });

  it('detects deck code and dispatches to parseDeckCode', () => {
    const code = getCodeFromDeck([{ cardCode: 'OGN-095', count: 3 }], [], 'OGN-103');
    const deck = parsePaste(code, 'Coded Deck', createResolver(cards));
    expect(deck.source).toBe('code');
    expect(deck.name).toBe('Coded Deck');
    expect(deck.zones.main.find((e) => e.cardName === 'Stupefy')?.count).toBe(3);
  });

  it('falls back to "Pasted deck" when name is empty or whitespace', () => {
    const text = 'MainDeck:\n3 Stupefy\n';
    const deck = parsePaste(text, '   ', createResolver(cards));
    expect(deck.name).toBe('Pasted deck');
  });

  it('trims surrounding whitespace from the input before dispatch', () => {
    const text = '\n\n  MainDeck:\n3 Stupefy\n  \n';
    const deck = parsePaste(text, 'X', createResolver(cards));
    expect(deck.source).toBe('text');
  });

  it('throws UnknownFormatError on unrecognized multi-token input', () => {
    expect(() =>
      parsePaste('hello world this is not anything', 'X', createResolver(cards))
    ).toThrow(UnknownFormatError);
  });

  it('throws UnknownFormatError on empty input', () => {
    expect(() => parsePaste('', 'X', createResolver(cards))).toThrow(UnknownFormatError);
    expect(() => parsePaste('   \n  ', 'X', createResolver(cards))).toThrow(UnknownFormatError);
  });

  it('exposes a registry that lists each supported format with detect/parse', () => {
    const ids = PASTE_FORMATS.map((f) => f.id);
    expect(ids).toContain('text');
    expect(ids).toContain('deck-code');
    for (const f of PASTE_FORMATS) {
      expect(typeof f.detect).toBe('function');
      expect(typeof f.parse).toBe('function');
      expect(typeof f.label).toBe('string');
    }
  });

  it('orders text before deck-code so the more specific detector wins', () => {
    const ids = PASTE_FORMATS.map((f) => f.id);
    expect(ids.indexOf('text')).toBeLessThan(ids.indexOf('deck-code'));
  });
});