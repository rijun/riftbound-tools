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
    // Real-world encoders already include the chosen champion in mainDeck
    // with its full count; chosenChampion is a metadata flag, not an extra
    // copy. Only push if it isn't already there (rare hand-crafted codes).
    const existing = deck.zones.main.find((e) => e.cardName === entry.cardName);
    if (!existing) deck.zones.main.push({ ...entry });
  } else {
    // Backfill: V3 codes may omit chosenChampion. If the main deck contains
    // exactly one Champion-supertype Unit, treat it as the chosen one for
    // subtitle purposes only — don't mirror into main, since the encoder
    // likely already counted the chosen copy in the main-deck count.
    const champCandidates = (decoded.mainDeck ?? []).filter((item) => {
      const c = resolver.byShortCode(item.cardCode);
      return c?.classification?.supertype === 'Champion';
    });
    if (champCandidates.length === 1) {
      const cand = champCandidates[0];
      const card = resolver.byShortCode(cand.cardCode);
      deck.zones.champion.push({
        count: 1,
        cardId: card?.id ?? cand.cardCode,
        cardName: card?.name ?? cand.cardCode,
        raw: `1 ${cand.cardCode}`
      });
    }
  }

  return deck;
}
