import type { Deck } from '../parser/types.ts';

// Order is also the tie-break order for "dominant" domain.
export const DOMAIN_ORDER = ['Body', 'Chaos', 'Mind', 'Calm', 'Order', 'Fury'] as const;
export type Domain = (typeof DOMAIN_ORDER)[number];

// Final palette tuned for WCAG AA on the dark Riftbound canvas.
// See tokens.css `--rb-domain-*` for the canonical values; these mirror them
// so deck accents stay synced with the design system.
export const DOMAIN_ACCENT: Record<Domain, string> = {
  Body: '#e2614f',
  Chaos: '#b07ad7',
  Mind: '#6da4ee',
  Calm: '#5fc9d9',
  Order: '#e6c279',
  Fury: '#ee6aa1'
};

const NEUTRAL = '#8d93a6';

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
