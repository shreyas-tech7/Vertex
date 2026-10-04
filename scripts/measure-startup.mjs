/**
 * Measures how long Vertex takes to hand the visitor a usable calculator.
 *
 *   node scripts/measure-startup.mjs           5 cold runs and 5 warm runs, medians printed
 *   RUNS=10 node scripts/measure-startup.mjs
 *
 * "Usable" is the moment the calculator reaches data-phase="running": the ROM has been found in IndexedDB, CEmu has
 * booted it, and the frame loop is going. The warm path is the one that matters most and the one this script checks
 * honestly: it reloads a context that already has the ROM, so the load really does come from IndexedDB, not from a
 * shortcut.
 *
 * The ROM is the synthetic test fixture. No real ROM is involved, and no TI-OS runs.
 */
import { chromium } from 'playwright-core';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';

const base = process.env.BASE_URL || 'http://localhost:4173';
const runs = Number.parseInt(process.env.RUNS ?? '5', 10);
const builder = buildSyntheticRom.toString();

const marker = `
  window.__vertexMarks = { frame: null, running: null };
  (() => {
    const check = () => {
      const el = document.querySelector('.calc-body');
      if (!el) return;
      if (window.__vertexMarks.frame === null) window.__vertexMarks.frame = performance.now();
      if (el.getAttribute('data-phase') === 'running' && window.__vertexMarks.running === null) {
        window.__vertexMarks.running = performance.now();
      }
    };
    new MutationObserver(check).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-phase'],
    });
    document.addEventListener('DOMContentLoaded', check);
  })();
`;

/** Leaves the synthetic ROM in IndexedDB, exactly as a previous visit would have. */
const seedRom = `
  (() => {
    const build = ${builder};
    const rom = build();
    const open = indexedDB.open('vertex-calculator');
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv');
    };
    open.onsuccess = () => {
      open.result
        .transaction('kv', 'readwrite')
        .objectStore('kv')
        .put({ name: 'stored.rom', size: rom.byteLength, data: rom.buffer, savedAt: Date.now() }, 'rom');
    };
  })();
`;

const browser = await chromium.launch({
  executablePath: process.env.VERTEX_CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-gpu'],
});

/** One load. `context` is reused for warm runs, so its cache and service worker stay warm. */
async function measure(context) {
  const page = await context.newPage();
  await page.addInitScript(marker);
  const started = Date.now();
  await page.goto(`${base}/calculator.html`, { waitUntil: 'commit' });
  await page.waitForSelector('.calc-body[data-phase="running"]', { timeout: 60_000 });
  const wall = Date.now() - started;
  const marks = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return {
      frame: window.__vertexMarks.frame,
      running: window.__vertexMarks.running,
      responseEnd: entry?.responseEnd ?? null,
      domContentLoaded: entry?.domContentLoadedEventEnd ?? null,
    };
  });
  await page.close();
  return { wall, ...marks };
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};
const round = (value) => Math.round(value);

async function runCold() {
  const results = [];
  for (let i = 0; i < runs; i++) {
    // A fresh context every time: empty HTTP cache, no service worker, no storage.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(seedRom);
    results.push(await measure(context));
    await context.close();
  }
  return results;
}

async function runWarm() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(seedRom);
  const results = [await measure(context)];
  // Let the service worker register and take control, then measure the load every visitor gets after that.
  const warmup = await context.newPage();
  await warmup.goto(`${base}/calculator.html`, { waitUntil: 'load' });
  await warmup.waitForSelector('.calc-body[data-phase="running"]', { timeout: 60_000 });
  const controlled = await warmup
    .evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return registration.active !== null;
    })
    .catch(() => false);
  await warmup.close();
  for (let i = 1; i < runs; i++) results.push(await measure(context));
  await context.close();
  return { results, controlled };
}

const cold = await runCold();
const warm = await runWarm();

const report = (label, rows) => {
  const pick = (key) => rows.map((row) => row[key]).filter((value) => typeof value === 'number');
  console.log(
    `${label}: ${rows.length} runs, median ${round(median(pick('running')))} ms to a usable calculator ` +
      `(min ${round(Math.min(...pick('running')))}, max ${round(Math.max(...pick('running')))})`,
  );
  console.log(
    `  median ${round(median(pick('frame')))} ms to the calculator frame, ` +
      `${round(median(pick('responseEnd')))} ms to the HTML response, ` +
      `${round(median(pick('domContentLoaded')))} ms to DOMContentLoaded, ` +
      `${round(median(pick('wall')))} ms measured from outside the browser`,
  );
};

console.log(`startup timing against ${base} (${runs} runs each)`);
report('cold load (empty cache, no service worker)', cold);
report('warm load (same context, cache and service worker warm)', warm.results);
console.log(`service worker took control during the warm runs: ${warm.controlled}`);
console.log(
  JSON.stringify(
    {
      base,
      runs,
      cold: {
        running: round(median(cold.map((r) => r.running))),
        frame: round(median(cold.map((r) => r.frame))),
      },
      warm: {
        running: round(median(warm.results.map((r) => r.running))),
        frame: round(median(warm.results.map((r) => r.frame))),
        serviceWorker: warm.controlled,
      },
    },
    null,
    2,
  ),
);

await browser.close();
