import { getDeckFromCode } from '@piltoverarchive/riftbound-deck-codes';
import { emptyZones, type Deck, type DeckEntry, type Zone } from './types.ts';
import type { Resolver } from '../cards/resolver.ts';
import type { Card } from '../cards/types.ts';

function uuid(): string {
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function zoneForCard(card: Card | undefined): Zone {
  switch (card?.classification?.type) {
    case 'Rune': return 'runes';
    case 'Battlefield': return 'battlefields';
    case 'Legend': return 'legend';
    default: return 'main';
  }
}

function makeEntry(
  cardCode: string,
  count: number,
  resolver: Resolver
): { entry: DeckEntry; card?: Card } {
  const card = resolver.byShortCode(cardCode);
  return {
    entry: {
      count,
      cardId: card?.id ?? cardCode,
      cardName: card?.name ?? cardCode,
      raw: `${count} ${cardCode}`
    },
    card
  };
}

export function parseDeckCode(code: string, name: string, resolver: Resolver): Deck {
  let decoded: ReturnType<typeof getDeckFromCode>;
  try {
    decoded = getDeckFromCode(code.trim());
  } catch (e) {
    throw new Error(`Invalid deck code: ${(e as Error).message}`);
  }

  const deck: Deck = {
    id: uuid(),
    name: name.trim() || 'Pasted deck',
    source: 'code',
    zones: emptyZones(),
    warnings: []
  };

  for (const item of decoded.mainDeck ?? []) {
    const { entry, card } = makeEntry(item.cardCode, item.count, resolver);
    if (!card) deck.warnings.push(`Unresolved card code: ${item.cardCode}`);
    deck.zones[zoneForCard(card)].push(entry);
  }

  for (const item of decoded.sideboard ?? []) {
    const { entry, card } = makeEntry(item.cardCode, item.count, resolver);
    if (!card) deck.warnings.push(`Unresolved sideboard code: ${item.cardCode}`);
    deck.zones.sideboard.push(entry);
  }

  if (decoded.chosenChampion) {
    const { entry, card } = makeEntry(decoded.chosenChampion, 1, resolver);
    if (!card) deck.warnings.push(`Unresolved chosen champion code: ${decoded.chosenChampion}`);
    deck.zones.champion.push(entry);
  }

  return deck;
}
