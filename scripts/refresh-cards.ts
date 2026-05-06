import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Card, CardDb } from '../src/lib/cards/types.ts';

const BASE = 'https://api.riftcodex.com';
const PAGE_SIZE = 100;

async function fetchPage(page: number): Promise<{ items: Card[]; total: number }> {
  const url = `${BASE}/cards?page=${page}&size=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  // Defensive: API shape uses `items` and `total` typically; fall back to `data`.
  const items: Card[] = data.items ?? data.data ?? data.cards ?? [];
  const total: number = data.total ?? data.count ?? items.length;
  return { items, total };
}

async function main() {
  console.log('Fetching cards from riftcodex API...');
  const all: Card[] = [];
  let page = 1;
  // First page to learn total
  const first = await fetchPage(page);
  all.push(...first.items);
  const totalPages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  console.log(`Total: ${first.total} cards across ${totalPages} page(s)`);
  for (page = 2; page <= totalPages; page++) {
    const { items } = await fetchPage(page);
    all.push(...items);
    console.log(`  page ${page}/${totalPages} (${all.length} so far)`);
  }
  const db: CardDb = {
    cards: all,
    fetchedAt: new Date().toISOString(),
    source: 'api'
  };
  const out = resolve('static/cards.json');
  await writeFile(out, JSON.stringify(db, null, 2));
  console.log(`Wrote ${all.length} cards to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
