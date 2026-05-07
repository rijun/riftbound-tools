import type { Deck } from '../parser/types.ts';
import { buildComparison, serialize, parseComparison, InvalidComparisonError } from './comparison.ts';

export type SortMode = 'alpha' | 'presence' | 'total';

const LS_KEY = 'riftbound:active-comparison';

class DecksState {
  decks = $state<Deck[]>([]);
  search = $state('');
  sort = $state<SortMode>('presence');
  /** id of a deck to focus the rows on (still shows other deck columns); '' = no filter */
  deckFilter = $state<string>('');

  add(deck: Deck) {
    const existingIdx = this.decks.findIndex((d) => d.name === deck.name);
    if (existingIdx >= 0) {
      // Preserve the existing deck's id so deckFilter and any expanded-row
      // state pointing at the prior deck remain valid through replacement.
      this.decks[existingIdx] = { ...deck, id: this.decks[existingIdx].id };
    } else {
      this.decks = [...this.decks, deck];
    }
    this.#persist();
  }

  remove(id: string) {
    this.decks = this.decks.filter((d) => d.id !== id);
    if (this.deckFilter === id) this.deckFilter = '';
    this.#persist();
  }

  move(id: string, toIndex: number) {
    const fromIndex = this.decks.findIndex((d) => d.id === id);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= this.decks.length) return;
    const next = [...this.decks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    this.decks = next;
    this.#persist();
  }

  clear() {
    this.decks = [];
    this.deckFilter = '';
    this.#persist();
  }

  /**
   * Atomic bulk replace — used by comparison-file import so we persist once,
   * not once per deck.
   */
  replaceAll(decks: Deck[]) {
    this.decks = [...decks];
    this.deckFilter = '';
    this.#persist();
  }

  /**
   * Restore from localStorage if a valid value is present. Call once on app boot.
   */
  restore() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const comparison = parseComparison(raw);
      this.decks = comparison.decks;
      this.deckFilter = '';
    } catch (e) {
      if (e instanceof InvalidComparisonError) {
        // Stored value is malformed — drop it silently.
        localStorage.removeItem(LS_KEY);
      }
      // Other errors: leave state untouched.
    }
  }

  #persist() {
    if (typeof localStorage === 'undefined') return;
    try {
      if (this.decks.length === 0) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      const payload = serialize(buildComparison(this.decks));
      localStorage.setItem(LS_KEY, payload);
    } catch {
      // Quota / private mode / etc. — silently ignore; in-memory state is fine.
    }
  }
}

export const decksState = new DecksState();
