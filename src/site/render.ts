import { APP_NAME } from '../core/brand.ts';
import { fill, fillDeep } from './i18n/format.ts';
import { STRINGS } from './i18n/index.ts';
import { LANGS, LANG_NAMES, type Lang, type LegalDoc, type Strings } from './i18n/types.ts';

/** Where the site is published. Used for hreflang, canonical links and the sitemap. Override with SITE_URL. */
export const DEFAULT_SITE_URL = 'https://shreyas-tech7.github.io/Vertex/';
export const GITHUB_URL = 'https://github.com/shreyas-tech7/Vertex';
export const CEMU_SOURCE_URL = 'https://github.com/CE-Programming/CEmu';
/** The corresponding-source archive built by emulator/build.sh and served with the site. */
export const SOURCE_ARCHIVE_PATH = 'source/vertex-emulator-source.tar.gz';

export type PageKind = 'home' | 'privacy' | 'terms';

export interface Page {
  /** Output path relative to the site root, e.g. `fr/privacy/index.html`. */
  file: string;
  lang: Lang;
  kind: PageKind;
  html: string;
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const brandValues = { brand: APP_NAME };
const strings = (lang: Lang): Strings => fillDeep(STRINGS[lang], brandValues);

/** Path of a page, as a directory URL from the site root: '' for English home, 'fr/' for French, 'fr/privacy/' ... */
function pagePath(lang: Lang, kind: PageKind): string {
  const prefix = lang === 'en' ? '' : `${lang}/`;
  return kind === 'home' ? prefix : `${prefix}${kind}/`;
}

/** The relative URL from a page to the site root, as '', '../' or '../../'. */
function rootPrefix(lang: Lang, kind: PageKind): string {
  const depth = (lang === 'en' ? 0 : 1) + (kind === 'home' ? 0 : 1);
  return '../'.repeat(depth);
}

/** Escapes text, then swaps the {anchor} placeholders for real links. */
function rich(text: string, anchors: Readonly<Record<string, string>>): string {
  return escapeHtml(text).replace(/\{(\w+)\}/g, (match, key: string) => anchors[key] ?? match);
}

const link = (href: string, label: string, extra = ''): string =>
  `<a href="${escapeHtml(href)}"${extra}>${escapeHtml(label)}</a>`;

function languageMenu(lang: Lang, kind: PageKind, s: Strings): string {
  const root = rootPrefix(lang, kind);
  const items = LANGS.map((target) => {
    const href = `${root}${pagePath(target, kind)}`;
    const current = target === lang ? ' aria-current="true"' : '';
    return `<li><a href="${href || './'}" lang="${target}" hreflang="${target}"${current}>${escapeHtml(LANG_NAMES[target])}</a></li>`;
  }).join('');
  return `<details class="lang-menu">
      <summary aria-label="${escapeHtml(s.languageLabel)}"><span aria-hidden="true">🌐</span> ${escapeHtml(LANG_NAMES[lang])}</summary>
      <ul>${items}</ul>
    </details>`;
}

function head(
  lang: Lang,
  kind: PageKind,
  s: Strings,
  title: string,
  description: string,
  siteUrl: string,
): string {
  const alternates = LANGS.map(
    (target) => `<link rel="alternate" hreflang="${target}" href="${siteUrl}${pagePath(target, kind)}">`,
  ).join('\n    ');
  return `<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${siteUrl}${pagePath(lang, kind)}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${siteUrl}${pagePath('en', kind)}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="${lang}">
    <meta name="theme-color" content="#ffffff">
    <link rel="stylesheet" href="/src/site/site.css">`;
}

function topBar(lang: Lang, kind: PageKind, s: Strings): string {
  const home = `${rootPrefix(lang, kind)}${pagePath(lang, 'home')}` || './';
  return `<div class="top-header">
        <a href="${home}" class="site-name">${escapeHtml(APP_NAME)}</a>
        ${languageMenu(lang, kind, s)}
    </div>`;
}

function footer(lang: Lang, kind: PageKind, s: Strings): string {
  const root = rootPrefix(lang, kind);
  const f = s.footer;
  const anchors = {
    cemu: link(CEMU_SOURCE_URL, f.cemuLink, ' target="_blank" rel="noopener noreferrer"'),
    source: link(`${root}${SOURCE_ARCHIVE_PATH}`, f.sourceLink),
    github: link(GITHUB_URL, f.githubLink, ' target="_blank" rel="noopener noreferrer"'),
  };
  const privacy = `${root}${pagePath(lang, 'privacy')}`;
  const terms = `${root}${pagePath(lang, 'terms')}`;
  return `<footer>
            <p><strong>${escapeHtml(f.disclaimerLead)}</strong> ${escapeHtml(f.disclaimer)}</p>
            <p>${rich(f.emulation, anchors)}</p>
            <p class="mt15">${escapeHtml(f.trademark)}</p>
            <p class="mt15"><strong>${escapeHtml(f.openSourceLead)}</strong> ${rich(f.openSource, anchors)}</p>
            <p class="mt15 footer-links">${link(privacy, f.privacy)} <span aria-hidden="true">·</span> ${link(terms, f.terms)}</p>
            <p class="mt15">${escapeHtml(f.copyright)}</p>
        </footer>`;
}

function renderHome(lang: Lang, siteUrl: string): string {
  const s = strings(lang);
  const root = rootPrefix(lang, 'home');
  const calculator = `${root}calculator.html?lang=${lang}`;
  const card = (c: { emoji: string; title: string; text: string }) => `
                    <div class="feature-card">
                        <h3>${c.emoji} ${escapeHtml(c.title)}</h3>
                        <p>${escapeHtml(c.text)}</p>
                    </div>`;
  const lead = (item: { lead: string; text: string }) =>
    `<strong>${escapeHtml(item.lead)}</strong> ${escapeHtml(item.text)}`;
  return `<!DOCTYPE html>
<!-- Generated by scripts/generate-pages.ts from src/site. Edit the source, not this file. -->
<html lang="${s.htmlLang}">
<head>
    ${head(lang, 'home', s, s.title, s.description, siteUrl)}
</head>
<body>
    ${topBar(lang, 'home', s)}

    <div class="calculator-iframe-container">
        <div class="calculator-iframe-wrapper">
            <h1>${escapeHtml(s.h1)}</h1>
            <p class="independent-notice"><strong>${escapeHtml(s.noticeLead)}</strong> ${escapeHtml(s.noticeBody)}</p>
            <iframe id="calculatorFrame" src="${calculator}" class="calculator-iframe" title="${escapeHtml(s.iframeTitle)}" frameborder="0" scrolling="no" allowfullscreen></iframe>
        </div>
    </div>

    <div class="container">
        <div class="content">
            <div class="section">
                <h2>${escapeHtml(s.about.heading)}</h2>
                ${s.about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n                ')}
            </div>

            <div class="calculator-preview">
                <img src="/preview.png" alt="${escapeHtml(s.previewAlt)}" class="preview-image" width="400" height="469">
            </div>

            <div class="section">
                <h2>${escapeHtml(s.features.heading)}</h2>
                <div class="features">${s.features.cards.map(card).join('')}
                </div>
            </div>

            <div class="section">
                <h2>${escapeHtml(s.how.heading)}</h2>
                <div class="usage-steps">
                    <ol>
                        ${s.how.steps.map((step) => `<li>${lead(step)}</li>`).join('\n                        ')}
                    </ol>
                </div>
            </div>

            <div class="section">
                <h2>${escapeHtml(s.perfect.heading)}</h2>
                <div class="highlight">
                    ${s.perfect.items.map((item) => `<p>${lead(item)}</p>`).join('\n                    ')}
                </div>
            </div>

            <div class="section">
                <h2>${escapeHtml(s.supported.heading)}</h2>
                <p>${escapeHtml(s.supported.intro)}</p>
                <ul class="list">
                    ${s.supported.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n                    ')}
                </ul>
            </div>

            <div class="section">
                <h2>${escapeHtml(s.requirements.heading)}</h2>
                <p>${escapeHtml(s.requirements.intro)}</p>
                <ul class="list">
                    ${s.requirements.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n                    ')}
                </ul>
                <p class="mt15">${escapeHtml(s.requirements.compat)}</p>
            </div>

            <div class="section cta-section">
                <h2>${escapeHtml(s.cta.heading)}</h2>
                <p>${escapeHtml(s.cta.text)}</p>
                <a href="#" class="cta-button">${escapeHtml(s.cta.button)}</a>
            </div>
        </div>

        ${footer(lang, 'home', s)}
    </div>

    <script type="module" src="/src/site/landing.ts"></script>
</body>
</html>
`;
}

function renderLegal(lang: Lang, kind: 'privacy' | 'terms', siteUrl: string): string {
  const s = strings(lang);
  const doc: LegalDoc = s[kind];
  const root = rootPrefix(lang, kind);
  const anchors = {
    github: link(GITHUB_URL, s.footer.githubLink, ' target="_blank" rel="noopener noreferrer"'),
  };
  const home = `${root}${pagePath(lang, 'home')}` || './';
  const title = `${doc.title} | ${APP_NAME}`;
  return `<!DOCTYPE html>
<!-- Generated by scripts/generate-pages.ts from src/site. Edit the source, not this file. -->
<html lang="${s.htmlLang}">
<head>
    ${head(lang, kind, s, title, doc.description, siteUrl)}
</head>
<body>
    ${topBar(lang, kind, s)}

    <div class="container">
        <div class="content legal">
            <h1>${escapeHtml(doc.title)}</h1>
            <p class="updated">${escapeHtml(doc.updated)}</p>
            <p>${rich(doc.intro, anchors)}</p>
            ${doc.sections
              .map(
                (section) => `<div class="section">
                <h2>${escapeHtml(section.heading)}</h2>
                ${section.paragraphs.map((p) => `<p>${rich(p, anchors)}</p>`).join('\n                ')}
            </div>`,
              )
              .join('\n            ')}
            <p class="mt15"><a href="${home}">${escapeHtml(s.legalBack)}</a></p>
        </div>

        ${footer(lang, kind, s)}
    </div>

    <script type="module" src="/src/site/landing.ts"></script>
</body>
</html>
`;
}

/** Every generated page: nine languages, each with a home page, a privacy policy and terms of service. */
export function renderAllPages(siteUrl: string = DEFAULT_SITE_URL): Page[] {
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const pages: Page[] = [];
  for (const lang of LANGS) {
    pages.push({
      file: `${pagePath(lang, 'home')}index.html`,
      lang,
      kind: 'home',
      html: renderHome(lang, base),
    });
    for (const kind of ['privacy', 'terms'] as const) {
      pages.push({
        file: `${pagePath(lang, kind)}index.html`,
        lang,
        kind,
        html: renderLegal(lang, kind, base),
      });
    }
  }
  return pages;
}

export { fill };
