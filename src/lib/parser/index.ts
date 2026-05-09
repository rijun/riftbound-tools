import type { Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';
import { parseTextList, deckNameFromFilename } from './text-parser.ts';

export type ParseResult =
  | { ok: true; deck: Deck }
  | { ok: false; filename: string; error: string };

export async function parseFile(file: File, resolver: Resolver): Promise<ParseResult> {
  const text = await file.text();
  const filename = file.name;
  if (filename.toLowerCase().endsWith('.json') || text.trimStart().startsWith('{')) {
    return {
      ok: false,
      filename,
      error: 'JSON deck files are no longer supported. Paste the deck code instead.'
    };
  }
  try {
    const deck = parseTextList(text, deckNameFromFilename(filename), resolver);
    return { ok: true, deck };
  } catch (e) {
    return { ok: false, filename, error: (e as Error).message };
  }
}
