import type { Card } from './types.ts';

export type Resolver = {
  byId: (id: string) => Card | undefined;
  byName: (name: string) => Card | undefined;
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function createResolver(cards: Card[]): Resolver {
  const byIdMap = new Map<string, Card>();
  const byExactName = new Map<string, Card>();
  const byLowerName = new Map<string, Card>();
  for (const c of cards) {
    byIdMap.set(c.id, c);
    byExactName.set(c.name, c);
    byLowerName.set(c.name.toLowerCase(), c);
  }
  return {
    byId: (id) => byIdMap.get(id),
    byName: (name) => {
      const exact = byExactName.get(name);
      if (exact) return exact;
      const ci = byLowerName.get(name.toLowerCase());
      if (ci) return ci;
      // fuzzy fallback within distance 2
      const target = name.toLowerCase();
      let best: { card: Card; d: number } | undefined;
      for (const [lower, card] of byLowerName) {
        const d = levenshtein(target, lower);
        if (d <= 2 && (!best || d < best.d)) best = { card, d };
        if (best?.d === 0) break;
      }
      return best?.card;
    }
  };
}
