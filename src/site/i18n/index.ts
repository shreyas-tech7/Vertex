import { de } from './de.ts';
import { en } from './en.ts';
import { es } from './es.ts';
import { fr } from './fr.ts';
import { it } from './it.ts';
import { ja } from './ja.ts';
import { pt } from './pt.ts';
import { ru } from './ru.ts';
import { sv } from './sv.ts';
import { LANGS, type Lang, type Strings } from './types.ts';

export const STRINGS: Readonly<Record<Lang, Strings>> = { en, fr, de, ja, it, es, pt, sv, ru };

export { LANGS };
export type { Lang, Strings };
