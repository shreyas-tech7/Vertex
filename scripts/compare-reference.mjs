// Compares Vertex's landing page with the reference landing page (bifdu9898/TI84Calculator, MIT).
// The live ti84calculator.io is not reachable from every network, so the reference is the repo's own index.html,
// served locally. Its calculator iframe is replaced by a blank page, so nothing is ever requested from TI or Pearson.
// Usage: REF_DIR=/path/to/TI84Calculator VERTEX_CHROMIUM_PATH=... node scripts/compare-reference.mjs
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const vertexUrl = process.env.BASE_URL || 'http://localhost:4173';
const refDir = process.env.REF_DIR || '/home/user/bifdu9898/ti84calculator';
const out = process.env.OUT_DIR || 'screenshots';
mkdirSync(out, { recursive: true });

const grey = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAAQ0lEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwZ0yAAAZ8Wz8wAAAAASUVORK5CYII=',
  'base64',
);
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://x').pathname;
  if (path === '/' || path === '/index.html') {
    response.setHeader('content-type', 'text/html');
    response.end(readFileSync(resolve(refDir, 'index.html')));
  } else if (path === '/ti84calc.html') {
    response.setHeader('content-type', 'text/html');
    response.end('<!doctype html><title>blank</title><body style="margin:0;background:#fff"></body>');
  } else if (path === '/calc.png') {
    response.setHeader('content-type', 'image/png');
    response.end(grey);
  } else {
    response.statusCode = 404;
    response.end();
  }
});
await new Promise((done) => server.listen(4180, done));
const referenceUrl = 'http://localhost:4180/';

const browser = await chromium.launch({
  executablePath: process.env.VERTEX_CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-gpu'],
});

const properties = [
  'display',
  'position',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'color',
  'backgroundColor',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderTopColor',
  'borderBottomWidth',
  'borderBottomColor',
  'borderTopLeftRadius',
  'textAlign',
  'textDecorationLine',
  'maxWidth',
  'minHeight',
  'gridTemplateColumns',
  'gap',
  'opacity',
];

// [name, selector in the reference, selector in Vertex]. Same element, same role.
const pairs = [
  ['body', 'body', 'body'],
  ['top bar', '.top-header', '.top-header'],
  ['site name', '.site-name', '.site-name'],
  ['calculator band', '.calculator-iframe-container', '.calculator-iframe-container'],
  ['band wrapper', '.calculator-iframe-wrapper', '.calculator-iframe-wrapper'],
  ['H1', '.calculator-iframe-wrapper h1', '.calculator-iframe-wrapper h1'],
  ['iframe', '#calculatorFrame', '#calculatorFrame'],
  ['container', '.container', '.container'],
  ['content', '.content', '.content'],
  ['About heading', '.section:nth-of-type(1) h2', '.section:nth-of-type(1) h2'],
  ['About paragraph', '.section:nth-of-type(1) p', '.section:nth-of-type(1) p'],
  ['preview frame', '.calculator-preview', '.calculator-preview'],
  ['preview image', '.calculator-preview img', '.calculator-preview img'],
  ['features grid', '.features', '.features'],
  ['feature card', '.feature-card', '.feature-card'],
  ['feature card title', '.feature-card h3', '.feature-card h3'],
  ['feature card text', '.feature-card p', '.feature-card p'],
  ['usage steps', '.usage-steps', '.usage-steps'],
  ['usage step', '.usage-steps li', '.usage-steps li'],
  ['perfect-for box', '.highlight', '.highlight'],
  ['perfect-for line', '.highlight p', '.highlight p'],
  ['list', '.section ul', '.section ul'],
  ['CTA section', '.section:last-of-type', '.cta-section'],
  ['CTA button', '.cta-button', '.cta-button'],
  ['footer', 'footer', 'footer'],
  ['footer link', 'footer a', 'footer a'],
  ['footer line', 'footer p', 'footer p'],
];

const HEIGHT_COMPARED = new Set(['top bar', 'site name', 'H1', 'CTA button', 'preview frame']);

async function measure(page, selector) {
  return page.evaluate(
    ([sel, props]) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const styles = Object.fromEntries(props.map((p) => [p, style[p]]));
      return {
        box: {
          x: Math.round(box.x * 10) / 10,
          width: Math.round(box.width * 10) / 10,
          height: Math.round(box.height * 10) / 10,
        },
        styles,
      };
    },
    [selector, properties],
  );
}

const results = {};
for (const [label, viewport] of [
  ['desktop 1920x855', { width: 1920, height: 855 }],
  ['phone 390x844', { width: 390, height: 844 }],
]) {
  const pages = {};
  for (const [name, url] of [
    ['reference', referenceUrl],
    ['vertex', vertexUrl],
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await context.newPage();
    const foreign = [];
    await page.route('**/*', (route) => {
      const target = new URL(route.request().url());
      if (target.protocol === 'http:' && target.hostname === 'localhost') return route.continue();
      if (target.protocol === 'data:' || target.protocol === 'blob:') return route.continue();
      foreign.push(route.request().url());
      return route.abort();
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${name}-${viewport.width}.png`, fullPage: true });
    const measured = {};
    for (const [pairName, referenceSelector, vertexSelector] of pairs) {
      measured[pairName] = await measure(page, name === 'reference' ? referenceSelector : vertexSelector);
    }
    const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    pages[name] = { measured, foreign, documentHeight };
    await context.close();
  }
  const rows = [];
  for (const [pairName] of pairs) {
    const a = pages.reference.measured[pairName];
    const b = pages.vertex.measured[pairName];
    if (!a || !b) {
      rows.push({
        element: pairName,
        status: !a && !b ? 'missing in both' : !a ? 'only in Vertex' : 'only in reference',
      });
      continue;
    }
    const differences = [];
    for (const p of properties)
      if (a.styles[p] !== b.styles[p]) differences.push(`${p}: ${a.styles[p]} -> ${b.styles[p]}`);
    // Heights only where the text cannot change them: one-line elements and boxes with fixed sizes.
    const compared = HEIGHT_COMPARED.has(pairName) ? ['x', 'width', 'height'] : ['x', 'width'];
    for (const p of compared)
      if (Math.abs(a.box[p] - b.box[p]) > 0.6) differences.push(`box.${p}: ${a.box[p]} -> ${b.box[p]}`);
    rows.push({ element: pairName, status: differences.length ? 'differs' : 'identical', differences });
  }
  results[label] = {
    documentHeight: { reference: pages.reference.documentHeight, vertex: pages.vertex.documentHeight },
    blockedForeignRequests: { reference: pages.reference.foreign, vertex: pages.vertex.foreign },
    rows,
  };
}
await browser.close();
server.close();
writeFileSync(`${out}/compare-reference.json`, JSON.stringify(results, null, 2));

for (const [label, result] of Object.entries(results)) {
  console.log(`\n== ${label} ==`);
  console.log(
    'document height',
    result.documentHeight,
    'foreign requests',
    JSON.stringify(result.blockedForeignRequests),
  );
  for (const row of result.rows) {
    console.log(`${row.status.padEnd(18)} ${row.element}`);
    for (const d of row.differences ?? []) console.log(`    ${d}`);
  }
}
