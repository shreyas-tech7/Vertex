// Measures the built landing page and calculator page against the published layout targets and prints each one as
// "match" or "off by N px". Needs `vite preview` on port 4173 (or BASE_URL).
// Usage: VERTEX_CHROMIUM_PATH=... OUT_DIR=screenshots node scripts/measure-targets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:4173';
const out = process.env.OUT_DIR || 'screenshots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.VERTEX_CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-gpu'],
});

const rows = [];
/** Records one target. `tolerance` is how many px still count as a match (0.6 covers sub-pixel rounding). */
function check(group, name, actual, target, tolerance = 0.6) {
  const diff = Math.round((actual - target) * 10) / 10;
  rows.push({
    group,
    name,
    target,
    actual: typeof actual === 'number' ? Math.round(actual * 10) / 10 : actual,
    result: Math.abs(diff) <= tolerance ? 'match' : `off by ${Math.abs(diff)} px`,
  });
}
function checkText(group, name, actual, target) {
  rows.push({ group, name, target, actual, result: actual === target ? 'match' : 'differs' });
}

const rect = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height };
  }, selector);
const style = (page, selector, props) =>
  page.evaluate(
    ([sel, list]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return Object.fromEntries(list.map((p) => [p, s[p]]));
    },
    [selector, props],
  );

async function openLanding(viewport, zoom) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  if (zoom !== undefined)
    await page.addInitScript((z) => localStorage.setItem('vertex_zoom_level', z), String(zoom));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const frame = page.frameLocator('#calculatorFrame');
  await frame.locator('.calc-body').waitFor();
  await page.waitForTimeout(900);
  return { context, page, frame };
}

// ---------------------------------------------------------------- desktop 1920x855
{
  const group = 'desktop 1920x855';
  const { context, page, frame } = await openLanding({ width: 1920, height: 855 });
  const bar = await rect(page, '.top-header');
  check(group, 'top bar height (no height set)', bar.height, 80);
  const button = await rect(page, '.lang-menu summary');
  check(group, 'language button width', button.width, 126);
  check(group, 'language button height', button.height, 39);
  const h1 = await rect(page, '.calculator-iframe-wrapper h1');
  const h1Style = await style(page, '.calculator-iframe-wrapper h1', ['fontSize', 'fontWeight', 'color']);
  check(group, 'H1 top', h1.y, 120);
  check(group, 'H1 height', h1.height, 51.2);
  checkText(
    group,
    'H1 font',
    `${h1Style.fontSize} ${h1Style.fontWeight} ${h1Style.color}`,
    '32px 700 rgb(51, 51, 51)',
  );
  const notice = await rect(page, '.independent-notice');
  check(group, 'notice width', notice.width, 680);
  check(group, 'notice height (about 70)', notice.height, 70, 6);
  check(group, 'notice top', notice.y, 171);
  const iframe = await rect(page, '#calculatorFrame');
  check(group, 'iframe width', iframe.width, 600);
  check(group, 'iframe height', iframe.height, 754);
  check(group, 'iframe top (about 261)', iframe.y, 261, 1);

  const zoomButton = await frame.locator('#zoom_controls button').first().boundingBox();
  check(group, 'zoom button height', zoomButton.height, 38);
  const body = await frame.locator('.calc-body').boundingBox();
  const frameBox = await page.locator('#calculatorFrame').boundingBox();
  check(group, 'case width', body.width, 258);
  check(group, 'case height', body.height, 604);
  check(group, 'case x in frame', body.x - frameBox.x, 171);
  check(group, 'case y in frame', body.y - frameBox.y, 78);
  const screen = await frame.locator('.screen').boundingBox();
  check(group, 'LCD width', screen.width, 232);
  check(group, 'LCD height', screen.height, 174);
  check(group, 'LCD x in case', screen.x - body.x, 13);
  check(group, 'LCD y in case', screen.y - body.y, 29);

  const headings = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll('.content .section h2')];
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    return { about: top(h2[0]), keyFeatures: top(h2[1]), count: h2.length };
  });
  check(group, 'About heading to Key Features heading', headings.keyFeatures - headings.about, 442);
  const preview = await rect(page, '.calculator-preview');
  const previewImg = await rect(page, '.calculator-preview img');
  check(group, 'preview block height', preview.height, 136.6);
  check(group, 'preview image box width', previewImg.width, 130);
  check(group, 'preview image box height', previewImg.height, 130);
  const cards = await page.evaluate(() => {
    const list = [...document.querySelectorAll('.feature-card')].map((c) => c.getBoundingClientRect());
    return { first: list[0], second: list[1] };
  });
  check(group, 'feature card width', cards.first.width, 260);
  check(group, 'feature card gap', cards.second.left - cards.first.right, 20);
  const footer = await rect(page, 'footer');
  const footerStyle = await style(page, 'footer', [
    'backgroundColor',
    'borderTopWidth',
    'borderTopColor',
    'paddingTop',
    'paddingLeft',
  ]);
  check(group, 'footer width', footer.width, 900);
  checkText(group, 'footer background', footerStyle.backgroundColor, 'rgb(250, 250, 250)');
  checkText(
    group,
    'footer border',
    `${footerStyle.borderTopWidth} ${footerStyle.borderTopColor}`,
    '1px rgb(224, 224, 224)',
  );
  checkText(group, 'footer padding', `${footerStyle.paddingTop} ${footerStyle.paddingLeft}`, '30px 40px');
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  check(group, 'whole page height', pageHeight, 4037, 0.6);
  await page.screenshot({ path: `${out}/vertex-1920.png`, fullPage: true });
  await context.close();
}

// ---------------------------------------------------------------- phone 390x844
{
  const group = 'phone 390x844';
  const { context, page, frame } = await openLanding({ width: 390, height: 844 });
  const bar = await rect(page, '.top-header');
  check(group, 'top bar height', bar.height, 70);
  const h1 = await rect(page, '.calculator-iframe-wrapper h1');
  check(group, 'H1 top', h1.y, 110);
  check(group, 'H1 height (two lines)', h1.height, 102.4);
  const iframe = await rect(page, '#calculatorFrame');
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  check(group, 'iframe width (viewport minus 40)', iframe.width, viewportWidth - 40);
  check(group, 'iframe height at 100% (target 700, formula gives 754)', iframe.height, 700);
  const body = await frame.locator('.calc-body').boundingBox();
  const frameBox = await page.locator('#calculatorFrame').boundingBox();
  check(group, 'case width', body.width, 258);
  const centred = (frameBox.width - 258) / 2;
  check(group, 'case centred in frame (x)', body.x - frameBox.x, centred, 1);
  rows.push({
    group,
    name: 'case never clipped',
    target: 'inside the frame',
    actual: `${Math.round(body.x - frameBox.x)} to ${Math.round(body.x - frameBox.x + body.width)} of ${frameBox.width}`,
    result:
      body.x >= frameBox.x && body.x + body.width <= frameBox.x + frameBox.width + 0.5 ? 'match' : 'clipped',
  });
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  rows.push({
    group,
    name: 'no horizontal page scroll',
    target: true,
    actual: noOverflow,
    result: noOverflow ? 'match' : 'differs',
  });
  await page.screenshot({ path: `${out}/vertex-390.png`, fullPage: true });
  await context.close();
}

// ---------------------------------------------------------------- phone zoom matrix
const matrix = [];
for (const viewportWidth of [320, 360, 390, 430]) {
  for (const requested of [0.5, 1, 2]) {
    const { context, page, frame } = await openLanding({ width: viewportWidth, height: 844 }, requested);
    const frameWidth = (await rect(page, '#calculatorFrame')).width;
    const shown = await frame.locator('#zoom_level').innerText();
    const body = await frame.locator('.calc-body').boundingBox();
    const iframe = await rect(page, '#calculatorFrame');
    const plusDisabled = await frame.getByRole('button', { name: 'Zoom in' }).isDisabled();
    const frameBox = await page.locator('#calculatorFrame').boundingBox();
    matrix.push({
      viewport: viewportWidth,
      frameWidth,
      requested: `${requested * 100}%`,
      shown,
      actualScale: Math.round((body.width / 258) * 1000) / 1000,
      caseWidth: Math.round(body.width * 10) / 10,
      fitsFrame: body.x >= frameBox.x - 0.5 && body.x + body.width <= frameBox.x + frameBox.width + 0.5,
      plusDisabled,
      iframeHeight: iframe.height,
    });
    await context.close();
  }
}
await browser.close();

writeFileSync(`${out}/measure-targets.json`, JSON.stringify({ rows, matrix }, null, 2));
let group = '';
for (const row of rows) {
  if (row.group !== group) {
    group = row.group;
    console.log(`\n== ${group} ==`);
  }
  console.log(`${row.result.padEnd(16)} ${row.name}: target ${row.target}, measured ${row.actual}`);
}
console.log('\n== phone zoom matrix (landing page, requested zoom -> actual) ==');
console.table(matrix);
const off = rows.filter((r) => r.result !== 'match');
console.log(`\n${rows.length - off.length} of ${rows.length} targets match, ${off.length} do not.`);
