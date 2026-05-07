/**
 * Vitest global setup.
 *
 * Node 25+ ships a native globalThis.localStorage that doesn't implement the
 * full Web Storage API (no clear(), no setItem(), etc.). This setup file
 * replaces it with a minimal in-memory implementation so persistence tests
 * work correctly.
 */
import { beforeEach } from 'vitest';

function makeStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    getItem(k: string) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(k: string, v: string) {
      store[k] = String(v);
    },
    removeItem(k: string) {
      delete store[k];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    }
  } as Storage;
}

// Install before any tests run in a file that uses this setup.
const storage = makeStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
  writable: true
});

// Clear between tests to avoid state leak.
beforeEach(() => {
  storage.clear();
});
