import type { Deck } from '../parser/types.ts';

// Order is also the tie-break order for "dominant" domain.
export const DOMAIN_ORDER = ['Body', 'Chaos', 'Mind', 'Calm', 'Order', 'Fury'] as const;
export type Domain = (typeof DOMAIN_ORDER)[number];

// Placeholder palette; final values selected during the frontend-design pass.
export const DOMAIN_ACCENT: Record<Domain, string> = {
  Body: '#c84d3b',
  Chaos: '#7a3b9a',
  Mind: '#3b6dc8',
  Calm: '#4ba3c4',
  Order: '#c9a96b',
  Fury: '#c2456b'
};

const NEUTRAL = '#7d808a';

function classifyRune(name: string): Domain | undefined {
  for (const d of DOMAIN_ORDER) {
    if (name.toLowerCase().startsWith(d.toLowerCase())) return d;
  }
  return undefined;
}

export function dominantDomain(deck: Deck): Domain | undefined {
  const totals: Record<string, number> = {};
  for (const e of deck.zones.runes) {
    const d = classifyRune(e.cardName);
    if (!d) continue;
    totals[d] = (totals[d] ?? 0) + e.count;
  }
  let best: { domain: Domain; total: number } | undefined;
  for (const d of DOMAIN_ORDER) {
    const t = totals[d] ?? 0;
    if (t > 0 && (!best || t > best.total)) best = { domain: d, total: t };
  }
  return best?.domain;
}

export function deckAccent(deck: Deck): string {
  const d = dominantDomain(deck);
  return d ? DOMAIN_ACCENT[d] : NEUTRAL;
}
