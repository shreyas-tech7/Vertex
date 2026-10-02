/**
 * Writes every landing, privacy and terms page (nine languages) to the repository root, where Vite picks them up.
 * Run it by hand with `node scripts/generate-pages.ts`. The Vite config also runs it on every dev and build start.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SITE_URL, renderAllPages, type Page } from '../src/site/render.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function generatePages(siteUrl: string = process.env.SITE_URL || DEFAULT_SITE_URL): Page[] {
  const pages = renderAllPages(siteUrl);
  for (const page of pages) {
    const target = resolve(root, page.file);
    mkdirSync(dirname(target), { recursive: true });
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (current !== page.html) writeFileSync(target, page.html);
  }
  return pages;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pages = generatePages();
  console.log(`wrote ${pages.length} pages`);
}
