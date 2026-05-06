import { emptyZones, type Deck, type Zone } from './types.ts';

const HEADER_TO_ZONE: Record<string, Zone> = {
  legend: 'legend',
  champion: 'champion',
  maindeck: 'main',
  'main deck': 'main',
  sideboard: 'sideboard',
  battlefields: 'battlefields',
  runes: 'runes'
};

const HEADER_RE = /^([A-Za-z][A-Za-z ]*):\s*$/;
const CARD_RE = /^\s*(\d+)\s+(.+?)\s*$/;
const PAREN_SET_RE = /\s*\(([A-Z]{2,5}-\d{2,4})\)\s*$/;

function deckNameFromFilename(filename: string): string {
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

export function parseText(text: string, filename: string): Deck {
  const deck: Deck = {
    id: uuid(),
    name: deckNameFromFilename(filename),
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
      deck.zones[zone].push({ count, cardName: name, cardId, raw: line.trim() });
      continue;
    }

    deck.warnings.push(`Unparsed line: ${line}`);
  }

  return deck;
}
