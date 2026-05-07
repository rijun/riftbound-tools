import { describe, it, expect } from 'vitest';
import { tokenizeCardText } from '../../src/lib/components/card-text-tokenize.ts';

describe('tokenizeCardText', () => {
  it('returns a single text token for plain input', () => {
    expect(tokenizeCardText('Just plain text')).toEqual([
      { kind: 'text', value: 'Just plain text' }
    ]);
  });

  it('extracts a single placeholder', () => {
    expect(tokenizeCardText(':rb_rune_chaos:')).toEqual([
      { kind: 'symbol', name: 'rb_rune_chaos' }
    ]);
  });

  it('mixes text and symbols', () => {
    const src = '[Equip] — :rb_rune_chaos:, Recycle 2 cards.';
    expect(tokenizeCardText(src)).toEqual([
      { kind: 'text', value: '[Equip] — ' },
      { kind: 'symbol', name: 'rb_rune_chaos' },
      { kind: 'text', value: ', Recycle 2 cards.' }
    ]);
  });

  it('handles multiple consecutive placeholders without text between them', () => {
    expect(tokenizeCardText(':rb_energy_2::rb_rune_calm:')).toEqual([
      { kind: 'symbol', name: 'rb_energy_2' },
      { kind: 'symbol', name: 'rb_rune_calm' }
    ]);
  });

  it('handles all known placeholder kinds', () => {
    const src = ':rb_rune_body::rb_rune_calm::rb_rune_chaos::rb_rune_fury::rb_rune_mind::rb_rune_order::rb_rune_rainbow::rb_energy_0::rb_energy_7::rb_might::rb_exhaust:';
    const tokens = tokenizeCardText(src);
    expect(tokens.length).toBe(11);
    expect(tokens.every((t) => t.kind === 'symbol')).toBe(true);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenizeCardText('')).toEqual([]);
  });
});
