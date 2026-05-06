import type { Deck } from '../parser/types.ts';

export type SortMode = 'alpha' | 'presence' | 'total';

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
  }

  remove(id: string) {
    this.decks = this.decks.filter((d) => d.id !== id);
    if (this.deckFilter === id) this.deckFilter = '';
  }

  move(id: string, toIndex: number) {
    const fromIndex = this.decks.findIndex((d) => d.id === id);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= this.decks.length) return;
    const next = [...this.decks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    this.decks = next;
  }

  clear() {
    this.decks = [];
  }
}

export const decksState = new DecksState();
