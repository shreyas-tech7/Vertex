// Prints every network request the site makes, grouped by origin, and fails if any goes outside the site's own origin.
// Visits all 27 pages, loads the synthetic test ROM, presses a key, reloads (restore from IndexedDB) and sends a file.
// Needs the built site on BASE_URL (default http://localhost:4173). Usage: VERTEX_CHROMIUM_PATH=... node scripts/network-log.mjs
import { chromium } from 'playwright-core';
import { renderAllPages } from '../src/site/render.ts';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';

const base = process.env.BASE_URL || 'http://localhost:4173';
const browser = await chromium.launch({
  executablePath: process.env.VERTEX_CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ serviceWorkers: 'allow' });
const page = await context.newPage();

const requests = [];
context.on('request', (request) => requests.push({ url: request.url(), type: request.resourceType() }));

for (const entry of renderAllPages()) {
  await page.goto(`${base}/${entry.file.replace(/index\.html$/, '')}`, { waitUntil: 'networkidle' });
}
await page.goto(`${base}/calculator.html`, { waitUntil: 'networkidle' });
await page.getByTestId('rom-input').setInputFiles({
  name: 'synthetic.rom',
  mimeType: 'application/octet-stream',
  buffer: Buffer.from(buildSyntheticRom()),
});
await page.waitForSelector('.calc-body[data-phase="running"]');
await page
  .locator('[data-key="ENTER"]')
  .dispatchEvent('pointerdown', { pointerId: 1, button: 0, pointerType: 'mouse' });
await page
  .locator('[data-key="ENTER"]')
  .dispatchEvent('pointerup', { pointerId: 1, button: 0, pointerType: 'mouse' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.calc-body[data-phase="running"]');
await browser.close();

const byOrigin = new Map();
for (const { url } of requests) {
  const origin = /^(data|blob|about):/.test(url) ? url.split(':')[0] + ':' : new URL(url).origin;
  byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + 1);
}
console.log(
  `${requests.length} requests while visiting 27 pages, loading a ROM, pressing a key and reloading with service workers on`,
);
for (const [origin, count] of byOrigin) console.log(`  ${String(count).padStart(5)}  ${origin}`);
const types = new Map();
for (const { url, type } of requests) {
  const path = /^(data|blob):/.test(url)
    ? url.split(':')[0]
    : new URL(url).pathname.replace(/-[\w-]{8}\./, '-HASH.');
  if (
    ['script', 'stylesheet', 'fetch', 'xhr', 'image', 'manifest', 'other'].includes(type) &&
    !/\/(fr|de|ja|it|es|pt|sv|ru)\//.test(path)
  )
    types.set(`${type} ${path}`, true);
}
console.log('distinct assets requested (language folders omitted):');
for (const key of [...types.keys()].sort()) console.log('   ', key);
const foreign = [...byOrigin.keys()].filter(
  (origin) => origin !== base && !['data:', 'blob:', 'about:'].includes(origin),
);
if (foreign.length > 0) {
  console.log('\nFOREIGN ORIGINS:', foreign.join(', '));
  process.exit(1);
}
console.log("\nno request left the site's own origin");
