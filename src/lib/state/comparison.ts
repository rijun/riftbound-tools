import type { Deck } from '../parser/types.ts';

export type ComparisonFile = {
  version: 1;
  exportedAt: string; // ISO timestamp
  decks: Deck[];
};

export class InvalidComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidComparisonError';
  }
}

function uuid(): string {
  return (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    .crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function buildComparison(decks: Deck[]): ComparisonFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    decks
  };
}

export function serialize(comparison: ComparisonFile): string {
  return JSON.stringify(comparison, null, 2);
}

export function defaultFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `comparison-${yyyy}-${mm}-${dd}.json`;
}

/**
 * Parse a JSON string into a ComparisonFile, validating the shape.
 * Regenerates deck ids so the imported decks don't collide with anything
 * already in memory.
 */
export function parseComparison(text: string): ComparisonFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new InvalidComparisonError(`Invalid JSON: ${(e as Error).message}`);
  }

  if (!raw || typeof raw !== 'object') {
    throw new InvalidComparisonError('Top-level value is not an object.');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new InvalidComparisonError(`Unsupported comparison file version: ${obj.version}.`);
  }
  if (!Array.isArray(obj.decks)) {
    throw new InvalidComparisonError('Missing or invalid "decks" array.');
  }

  // Validate each deck minimally: must have name (string) and zones (object with Zone keys).
  const decks: Deck[] = obj.decks.map((d, i) => {
    if (!d || typeof d !== 'object') {
      throw new InvalidComparisonError(`decks[${i}] is not an object.`);
    }
    const dr = d as Partial<Deck> & Record<string, unknown>;
    if (typeof dr.name !== 'string') {
      throw new InvalidComparisonError(`decks[${i}].name must be a string.`);
    }
    if (!dr.zones || typeof dr.zones !== 'object') {
      throw new InvalidComparisonError(`decks[${i}].zones must be an object.`);
    }
    return {
      id: uuid(), // fresh id on import
      name: dr.name,
      source: (dr.source === 'code' ? 'code' : 'text') as Deck['source'],
      zones: dr.zones as Deck['zones'],
      warnings: Array.isArray(dr.warnings) ? (dr.warnings as string[]) : []
    };
  });

  return {
    version: 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    decks
  };
}

/**
 * Trigger a file download in the browser.
 */
export function downloadComparison(comparison: ComparisonFile, filename: string): void {
  const blob = new Blob([serialize(comparison)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
