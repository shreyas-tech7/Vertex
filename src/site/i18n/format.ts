/** Fills {placeholders} in a translated string. Unknown placeholders stay as they are. */
export function fill(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Splits a string at one placeholder, so a component can put an element in the gap. */
export function splitAt(text: string, name: string): [before: string, after: string] | null {
  const marker = `{${name}}`;
  const at = text.indexOf(marker);
  if (at < 0) return null;
  return [text.slice(0, at), text.slice(at + marker.length)];
}

/** Fills placeholders in every string of a nested object or array, leaving the shape alone. */
export function fillDeep<T>(value: T, values: Readonly<Record<string, string>>): T {
  if (typeof value === 'string') return fill(value, values) as T;
  if (Array.isArray(value)) return value.map((item) => fillDeep(item, values)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillDeep(item, values)])) as T;
  }
  return value;
}
