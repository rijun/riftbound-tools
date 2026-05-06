import { emptyZones, type Deck } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';

type RawJsonDeck = {
  metadata?: { name?: string; author?: string };
  deck?: {
    'Main Board'?: Array<{ id: string; count: string | number }>;
    'Side Board'?: Array<{ id: string; count: string | number }>;
  };
};

function deckNameFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  return stem
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function uuid(): string {
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function parseJson(text: string, filename: string, resolver: Resolver): Deck {
  let raw: RawJsonDeck;
  try {
    raw = JSON.parse(text) as RawJsonDeck;
  } catch (e) {
    throw new Error(`Invalid JSON in ${filename}: ${(e as Error).message}`);
  }

  const deck: Deck = {
    id: uuid(),
    name: raw.metadata?.name ?? deckNameFromFilename(filename),
    source: 'json',
    zones: emptyZones(),
    warnings: []
  };

  const mainBoard = raw.deck?.['Main Board'] ?? [];
  const sideBoard = raw.deck?.['Side Board'] ?? [];

  for (const entry of mainBoard) {
    const card = resolver.byId(entry.id) ?? resolver.byShortCode(entry.id);
    deck.zones.main.push({
      count: Number(entry.count),
      cardId: entry.id,
      cardName: card?.name ?? entry.id,
      raw: `${entry.count} ${entry.id}`
    });
    if (!card) deck.warnings.push(`Unresolved id: ${entry.id}`);
  }
  for (const entry of sideBoard) {
    const card = resolver.byId(entry.id) ?? resolver.byShortCode(entry.id);
    deck.zones.sideboard.push({
      count: Number(entry.count),
      cardId: entry.id,
      cardName: card?.name ?? entry.id,
      raw: `${entry.count} ${entry.id}`
    });
    if (!card) deck.warnings.push(`Unresolved id: ${entry.id}`);
  }

  return deck;
}
