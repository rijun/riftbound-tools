export type Zone =
  | 'legend'
  | 'champion'
  | 'main'
  | 'sideboard'
  | 'battlefields'
  | 'runes';

export const ALL_ZONES: Zone[] = [
  'legend',
  'champion',
  'main',
  'sideboard',
  'battlefields',
  'runes'
];

export type DeckEntry = {
  count: number;
  cardName: string;
  cardId?: string;
  raw: string;
};

export type Deck = {
  id: string;
  name: string;
  source: 'text' | 'code';
  zones: Record<Zone, DeckEntry[]>;
  warnings: string[];
};

export function emptyZones(): Record<Zone, DeckEntry[]> {
  return {
    legend: [],
    champion: [],
    main: [],
    sideboard: [],
    battlefields: [],
    runes: []
  };
}
