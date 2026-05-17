import { emptyZones, type Deck, type DeckEntry, type Zone } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';

const HEADER_TO_ZONE: Record<string, Zone> = {
  legend: 'legend',
  champion: 'champion',
  maindeck: 'main',
  'main deck': 'main',
  sideboard: 'sideboard',
  battlefields: 'battlefields',
  runes: 'runes',
  'rune pool': 'runes'
};

const HEADER_RE = /^([A-Za-z][A-Za-z ]*):\s*$/;
const CARD_RE = /^\s*(\d+)\s+(.+?)\s*$/;
const PAREN_SET_RE = /\s*\(([A-Z]{2,5}-\d{2,4})\)\s*$/;

export function deckNameFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  return stem
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function uuid(): string {
  // Crypto-randomized; works in browsers and Node 19+.
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function parseTextList(text: string, name: string, resolver?: Resolver): Deck {
  const deck: Deck = {
    id: uuid(),
    name,
    source: 'text',
    zones: emptyZones(),
    warnings: []
  };

  let zone: Zone | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;
    if (!line.trim()) continue;

    const headerMatch = line.match(HEADER_RE);
    if (headerMatch) {
      const key = headerMatch[1].trim().toLowerCase();
      const z = HEADER_TO_ZONE[key];
      if (z) {
        zone = z;
        continue;
      }
      deck.warnings.push(`Unknown section header: ${line}`);
      continue;
    }

    const cardMatch = line.match(CARD_RE);
    if (cardMatch && zone) {
      const count = Number(cardMatch[1]);
      let name = cardMatch[2].trim();
      const paren = name.match(PAREN_SET_RE);
      let cardId: string | undefined;
      if (paren) {
        cardId = paren[1];
        name = name.replace(PAREN_SET_RE, '').trim();
      }
      const entry: DeckEntry = { count, cardName: name, cardId, raw: line.trim() };
      if (resolver) {
        const card =
          resolver.byName(entry.cardName) ??
          (entry.cardId ? resolver.byShortCode(entry.cardId) : undefined) ??
          (entry.cardId ? resolver.byId(entry.cardId) : undefined);
        if (card) {
          entry.cardName = card.name;
          entry.cardId = card.id;
        }
      }
      deck.zones[zone].push(entry);
      continue;
    }

    deck.warnings.push(`Unparsed line: ${line}`);
  }

  // Mirror chosen champions into the main deck — they are also regular cards.
  for (const champEntry of deck.zones.champion) {
    const existing = deck.zones.main.find((e) => e.cardName === champEntry.cardName);
    if (existing) {
      existing.count += champEntry.count;
    } else {
      // Clone so mutations to one zone don't bleed into the other.
      deck.zones.main.push({ ...champEntry });
    }
  }

  return deck;
}
