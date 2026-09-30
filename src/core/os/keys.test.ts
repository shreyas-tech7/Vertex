import { describe, expect, it } from 'vitest';
import { KEYS, KEY_BY_ID } from './keys';

describe('key table', () => {
  it('has 50 unique keys', () => {
    expect(KEYS).toHaveLength(50);
    expect(new Set(KEYS.map((x) => x.id)).size).toBe(50);
  });
  it('uses the documented getKey codes', () => {
    expect(KEY_BY_ID.get('ENTER')?.code).toBe(105);
    expect(KEY_BY_ID.get('GRAPH')?.code).toBe(15);
    expect(KEY_BY_ID.get('CLEAR')?.code).toBe(45);
    expect(KEY_BY_ID.get('ON')?.code).toBe(0);
    expect(KEY_BY_ID.get('0')?.code).toBe(102);
  });
});
