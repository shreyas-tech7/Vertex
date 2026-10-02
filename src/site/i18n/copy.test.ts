import { describe, expect, it } from 'vitest';
import { STRINGS } from './index.ts';
import { LANGS, LANG_NAMES, type Lang } from './types.ts';

/** Every string in a language, flattened with its path. */
function collect(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, i) => collect(item, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => collect(item, path ? `${path}.${key}` : key));
  }
  return [];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

describe('copy', () => {
  it('has nine languages with their own names', () => {
    expect(LANGS).toEqual(['en', 'fr', 'de', 'ja', 'it', 'es', 'pt', 'sv', 'ru']);
    expect(new Set(Object.values(LANG_NAMES)).size).toBe(9);
  });

  it.each(LANGS)('%s has the same shape as English', (lang: Lang) => {
    const english = collect(STRINGS.en).map(([path]) => path);
    expect(collect(STRINGS[lang]).map(([path]) => path)).toEqual(english);
  });

  it.each(LANGS)('%s has no empty strings', (lang: Lang) => {
    for (const [path, text] of collect(STRINGS[lang])) expect(text.trim(), path).not.toBe('');
  });

  it.each(LANGS.filter((l) => l !== 'en'))(
    '%s uses the same placeholders as English line by line',
    (lang: Lang) => {
      const english = new Map(collect(STRINGS.en));
      for (const [path, text] of collect(STRINGS[lang])) {
        expect(placeholders(text), `${lang} ${path}`).toEqual(placeholders(english.get(path)!));
      }
    },
  );

  it.each(LANGS.filter((l) => l !== 'en'))('%s is translated, not copied from English', (lang: Lang) => {
    const english = new Map(collect(STRINGS.en));
    const same = collect(STRINGS[lang]).filter(
      ([path, text]) =>
        text === english.get(path) &&
        !/emoji|cemuLink|githubLink|copyright|htmlLang/.test(path) &&
        text.length > 12,
    );
    expect(same).toEqual([]);
  });

  it.each(LANGS)(
    '%s follows the punctuation rules: no em dashes, no en dashes, no semicolons, no spaced hyphens',
    (lang: Lang) => {
      for (const [path, text] of collect(STRINGS[lang])) {
        expect(text, `${lang} ${path}`).not.toMatch(/[—–―;；;]| - | -- /);
      }
    },
  );

  it('keeps filler and buzzwords out of the English copy', () => {
    const banned =
      /\b(seamless(ly)?|delve|pivotal|testament|it is important to note|not just|robust|leverage|cutting-edge|game-changing|unlock)\b/i;
    for (const [path, text] of collect(STRINGS.en)) expect(text, path).not.toMatch(banned);
  });

  it('never claims Vertex is official or approved for exams', () => {
    const claims = collect(STRINGS.en).filter(([, text]) =>
      /official|standardized|exam compatible|accepted on/i.test(text),
    );
    // The terms say Vertex is NOT approved for exams. Nothing may say it is, and "official" may only appear in a negation.
    for (const [path, text] of claims)
      expect(text, path).toMatch(/not an approved|not affiliated|exam rules|check your exam/i);
  });

  it('puts the TI-84 Plus CE name only where it describes what the emulator runs', () => {
    const text = collect(STRINGS.en)
      .filter(([path]) => !/^(privacy|terms)/.test(path))
      .map(([, t]) => t)
      .join(' ');
    expect(text).toContain('TI-84 Plus CE');
    expect(text).not.toMatch(/TI 84 Calculator/);
  });
});
