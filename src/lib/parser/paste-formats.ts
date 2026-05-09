import type { Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';
import { parseTextList } from './text-parser.ts';
import { parseDeckCode } from './deck-code-parser.ts';

export type PasteFormat = {
  id: string;
  label: string;
  detect: (input: string) => boolean;
  parse: (input: string, name: string, resolver: Resolver) => Deck;
};

// Order matters: first match wins. Most-specific detectors first.
export const PASTE_FORMATS: PasteFormat[] = [
  {
    id: 'text',
    label: 'decklist text',
    detect: (input) => /^[A-Za-z][A-Za-z ]*:\s*$/m.test(input),
    parse: parseTextList
  },
  {
    id: 'deck-code',
    label: 'deck code',
    detect: (input) => /^\S{8,}$/.test(input),
    parse: parseDeckCode
  }
];

export class UnknownFormatError extends Error {
  constructor() {
    super('Could not recognize input as a decklist or deck code.');
    this.name = 'UnknownFormatError';
  }
}

export function parsePaste(input: string, name: string, resolver: Resolver): Deck {
  const trimmedInput = input.trim();
  const deckName = name.trim() || 'Pasted deck';
  for (const format of PASTE_FORMATS) {
    if (format.detect(trimmedInput)) {
      return format.parse(trimmedInput, deckName, resolver);
    }
  }
  throw new UnknownFormatError();
}