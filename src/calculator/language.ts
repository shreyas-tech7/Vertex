import { isLang, type Lang } from '../site/i18n/types.ts';

/** The page language: `?lang=fr` from the landing page's iframe, else the document's own `lang`, else English. */
export function pageLanguage(search: string, htmlLang: string): Lang {
  const fromQuery = new URLSearchParams(search).get('lang');
  if (isLang(fromQuery)) return fromQuery;
  const primary = htmlLang.toLowerCase().split('-')[0];
  return isLang(primary) ? primary : 'en';
}
