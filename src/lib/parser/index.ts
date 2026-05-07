import type { Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';
import { parseText } from './text-parser.ts';
import { parseJson } from './json-parser.ts';

export type ParseResult =
  | { ok: true; deck: Deck }
  | { ok: false; filename: string; error: string };

export async function parseFile(file: File, resolver: Resolver): Promise<ParseResult> {
  const text = await file.text();
  const filename = file.name;
  const isJson = filename.toLowerCase().endsWith('.json') || text.trimStart().startsWith('{');
  try {
    const deck = isJson ? parseJson(text, filename, resolver) : parseText(text, filename, resolver);
    return { ok: true, deck };
  } catch (e) {
    return { ok: false, filename, error: (e as Error).message };
  }
}
