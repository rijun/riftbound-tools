import type { Card, CardDb } from './types.ts';
import { createResolver, type Resolver } from './resolver.ts';

const LS_KEY = 'riftbound:cards-db';

function safeReadCache(): CardDb | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CardDb;
    if (!parsed?.cards || !Array.isArray(parsed.cards)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function safeWriteCache(db: CardDb) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    // quota / private mode — silently ignore; bundled file remains
  }
}

class CardStore {
  db = $state<CardDb | undefined>(undefined);
  resolver = $derived<Resolver | undefined>(
    this.db ? createResolver(this.db.cards) : undefined
  );
  refreshState = $state<{ status: 'idle' | 'loading' | 'error'; message?: string }>({
    status: 'idle'
  });

  async loadInitial(): Promise<void> {
    const cached = safeReadCache();
    if (cached) {
      this.db = { ...cached, source: 'cache' };
      return;
    }
    try {
      const res = await fetch('/cards.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundled = (await res.json()) as CardDb;
      this.db = { ...bundled, source: 'bundled' };
    } catch (err) {
      this.db = { cards: [], fetchedAt: new Date(0).toISOString(), source: 'bundled' };
      this.refreshState = {
        status: 'error',
        message: `Failed to load bundled card DB: ${(err as Error).message}`
      };
    }
  }

  async refreshFromApi(): Promise<void> {
    this.refreshState = { status: 'loading' };
    try {
      const all: Card[] = [];
      let page = 1;
      const PAGE_SIZE = 100;
      // First page
      const firstRes = await fetch(`https://api.riftcodex.com/cards?page=1&size=${PAGE_SIZE}`);
      if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`);
      const firstData = await firstRes.json();
      const firstItems: Card[] = firstData.items ?? firstData.data ?? firstData.cards ?? [];
      const total: number = firstData.total ?? firstData.count ?? firstItems.length;
      all.push(...firstItems);
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      for (page = 2; page <= totalPages; page++) {
        const r = await fetch(`https://api.riftcodex.com/cards?page=${page}&size=${PAGE_SIZE}`);
        if (!r.ok) throw new Error(`HTTP ${r.status} page ${page}`);
        const d = await r.json();
        all.push(...((d.items ?? d.data ?? d.cards ?? []) as Card[]));
      }
      const next: CardDb = {
        cards: all,
        fetchedAt: new Date().toISOString(),
        source: 'api'
      };
      this.db = next;
      safeWriteCache(next);
      this.refreshState = { status: 'idle' };
    } catch (err) {
      this.refreshState = {
        status: 'error',
        message: `Refresh failed: ${(err as Error).message}`
      };
    }
  }
}

export const cardStore = new CardStore();
