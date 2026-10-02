import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_NAME } from '../core/brand.ts';
import { CONTENT_SECURITY_POLICY } from './csp.ts';
import { STRINGS } from './i18n/index.ts';
import { LANGS } from './i18n/types.ts';
import { DEFAULT_SITE_URL, renderAllPages } from './render.ts';

const root = resolve(import.meta.dirname, '../..');
const pages = renderAllPages(DEFAULT_SITE_URL);

describe('generated pages', () => {
  it('covers nine languages, each with a home page, a privacy policy and terms', () => {
    expect(pages).toHaveLength(27);
    expect(pages.map((p) => p.file)).toContain('index.html');
    for (const lang of LANGS.filter((l) => l !== 'en')) {
      expect(pages.map((p) => p.file)).toEqual(
        expect.arrayContaining([
          `${lang}/index.html`,
          `${lang}/privacy/index.html`,
          `${lang}/terms/index.html`,
        ]),
      );
    }
  });

  it('are committed and in sync with the sources (run `node scripts/generate-pages.ts` after editing src/site)', () => {
    for (const page of pages) {
      const file = resolve(root, page.file);
      expect(existsSync(file), page.file).toBe(true);
      expect(readFileSync(file, 'utf8') === page.html, `${page.file} is stale`).toBe(true);
    }
  });

  it.each(pages.map((p) => [p.file, p] as const))(
    '%s sets its html lang and has hreflang links for all nine languages',
    (_file, page) => {
      expect(page.html).toContain(`<html lang="${STRINGS[page.lang].htmlLang}">`);
      for (const lang of LANGS) expect(page.html).toContain(`hreflang="${lang}"`);
      expect(page.html).toContain('hreflang="x-default"');
      expect(page.html).toContain('rel="canonical"');
    },
  );

  it.each(pages.map((p) => [p.file, p] as const))(
    '%s: every language link in the dropdown points at a real page',
    (_file, page) => {
      const menu = /<details class="lang-menu">[\s\S]*?<\/details>/.exec(page.html)![0];
      const hrefs = [...menu.matchAll(/<a href="([^"]*)" lang="(\w+)" hreflang="\w+"/g)];
      expect(hrefs.map((m) => m[2])).toEqual([...LANGS]);
      for (const [, href] of hrefs) {
        const target = resolve(root, dirname(page.file), href!, 'index.html');
        expect(
          pages.some((p) => resolve(root, p.file) === target),
          `${page.file} -> ${href}`,
        ).toBe(true);
      }
    },
  );

  it.each(pages.map((p) => [p.file, p] as const))(
    '%s links to its own privacy and terms pages and the footer source archive',
    (_file, page) => {
      const footer = /<footer>[\s\S]*<\/footer>/.exec(page.html)![0];
      expect(footer).toMatch(/href="[^"]*privacy\/"/);
      expect(footer).toMatch(/href="[^"]*terms\/"/);
      expect(footer).toContain('source/vertex-emulator-source.tar.gz');
      expect(footer).toContain('github.com/CE-Programming/CEmu');
      expect(footer).toContain('GPLv3');
      expect(footer).toContain('Texas Instruments');
    },
  );

  it('home pages keep the reference sections in the reference order', () => {
    const order = [
      'top-header',
      'calculator-iframe-container',
      '<h1>',
      'independent-notice',
      '<iframe',
      'About',
      'calculator-preview',
      'features',
      'usage-steps',
      'highlight',
      'cta-button',
      '<footer>',
    ];
    const home = pages.find((p) => p.file === 'index.html')!.html;
    let at = -1;
    for (const marker of order) {
      const next = home.indexOf(marker, at + 1);
      expect(next, marker).toBeGreaterThan(at);
      at = next;
    }
    const h2s = [...home.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1]);
    expect(h2s).toEqual([
      `About ${APP_NAME}`,
      'Key Features',
      'How to Use',
      'Perfect For',
      'Supported Functions',
      'System Requirements',
      'Ready to Get Started?',
    ]);
    expect([...home.matchAll(/class="feature-card"/g)]).toHaveLength(6);
  });

  it('home pages embed the standalone calculator page with the reference iframe attributes', () => {
    for (const lang of LANGS) {
      const home = pages.find((p) => p.lang === lang && p.kind === 'home')!.html;
      expect(home).toMatch(
        new RegExp(
          `<iframe id="calculatorFrame" src="(\\.\\./)?calculator\\.html\\?lang=${lang}" class="calculator-iframe"`,
        ),
      );
      expect(home).toContain('frameborder="0" scrolling="no" allowfullscreen');
    }
  });

  it('every page shows the independent-website notice on the landing page, and has no Contact line', () => {
    for (const lang of LANGS) {
      const home = pages.find((p) => p.lang === lang && p.kind === 'home')!.html;
      expect(home).toContain('class="independent-notice"');
      expect(home).not.toMatch(/mailto:/i);
    }
  });

  it('never mentions a Texas Instruments or Pearson host', () => {
    for (const page of pages) {
      expect(page.html, page.file).not.toMatch(/testnav|\bti\.com\b|pearson|ELG-min|h84statej|TI84CE_touch/i);
    }
  });

  it('uses no inline scripts and no inline styles, so the CSP can forbid them', () => {
    for (const page of pages) {
      expect(page.html, page.file).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
      expect(page.html, page.file).not.toMatch(/\sstyle="/);
      expect(page.html, page.file).not.toMatch(/\son\w+="/);
    }
  });
});

describe('content security policy', () => {
  it('allows scripts from self and wasm-unsafe-eval only, and no third-party origin', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/https?:|\*|unsafe-inline|(?<!wasm-)unsafe-eval/);
  });
});
