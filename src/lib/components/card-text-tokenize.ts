export type CardTextToken = { kind: 'text'; value: string } | { kind: 'symbol'; name: string };

const PLACEHOLDER_RE = /:([a-z][a-z0-9_]+):/g;

export function tokenizeCardText(source: string): CardTextToken[] {
  const tokens: CardTextToken[] = [];
  let last = 0;
  PLACEHOLDER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(source)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: source.slice(last, m.index) });
    tokens.push({ kind: 'symbol', name: m[1] });
    last = PLACEHOLDER_RE.lastIndex;
  }
  if (last < source.length) tokens.push({ kind: 'text', value: source.slice(last) });
  return tokens;
}
