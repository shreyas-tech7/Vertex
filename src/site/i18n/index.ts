import { en } from './en.ts';
import { LANGS, type Lang, type Strings } from './types.ts';

// TEMPORARY: the other eight languages arrive in the next commit.
export const STRINGS: Readonly<Record<Lang, Strings>> = {
  en,
  fr: en,
  de: en,
  ja: en,
  it: en,
  es: en,
  pt: en,
  sv: en,
  ru: en,
};

export { LANGS };
export type { Lang, Strings };
