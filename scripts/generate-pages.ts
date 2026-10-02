/**
 * Writes every landing, privacy and terms page (nine languages) to the repository root, where Vite picks them up,
 * plus the header configs, robots.txt and sitemap.xml that depend on the same sources.
 * Run it by hand with `node scripts/generate-pages.ts`. The Vite config also runs it on every dev and build start.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SITE_URL, renderAllPages, type Page } from '../src/site/render.ts';
import { renderSupportFiles } from '../src/site/support.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function generatePages(siteUrl: string = process.env.SITE_URL || DEFAULT_SITE_URL): Page[] {
  const pages = renderAllPages(siteUrl);
  const files = [
    ...pages.map((page) => ({ file: page.file, content: page.html })),
    ...renderSupportFiles(siteUrl),
  ];
  for (const { file, content } of files) {
    const target = resolve(root, file);
    mkdirSync(dirname(target), { recursive: true });
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (current !== content) writeFileSync(target, content);
  }
  return pages;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pages = generatePages();
  console.log(`wrote ${pages.length} pages`);
}
