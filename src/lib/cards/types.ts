export type Card = {
  id: string;
  name: string;
  riftbound_id?: string;
  tcgplayer_id?: string;
  public_code?: string;
  collector_number?: number;
  orientation?: string;
  attributes?: {
    energy?: number;
    might?: number;
    power?: number;
  };
  classification?: {
    type?: string;
    supertype?: string | null;
    rarity?: string;
    domain?: string[];
  };
  text?: {
    rich?: string;
    plain?: string;
    flavour?: string;
  };
  set?: {
    set_id: string;
    label: string;
  };
  media?: {
    image_url?: string;
    artist?: string;
    accessibility_text?: string;
  };
  tags?: string[];
  metadata?: {
    clean_name?: string;
    updated_on?: string;
    alternate_art?: boolean;
    overnumbered?: boolean;
    signature?: boolean;
  };
};

export type CardDb = {
  cards: Card[];
  fetchedAt: string;
  source: 'bundled' | 'api' | 'cache';
};
