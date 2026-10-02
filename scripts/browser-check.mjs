// Loads every Vertex page in Firefox or WebKit and reports console errors, page errors and third-party requests.
// Playwright covers these browsers in CI. This script is for machines where Playwright cannot download them and a
// stock Firefox or WebKitGTK is installed instead.
//
//   Firefox (WebDriver BiDi through puppeteer-core):
//     PUPPETEER_DIR=/dir/with/node_modules node scripts/browser-check.mjs firefox /path/to/firefox
//   WebKit (WebKitGTK through its WebDriver and selenium-webdriver, inside xvfb-run):
//     PUPPETEER_DIR=/dir/with/node_modules xvfb-run -a node scripts/browser-check.mjs webkit /usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser
//
// It serves dist/ itself with the same security headers as `vite preview`, so the build is checked under the full policy.
// Run `npm run build` first. WebKit has no console event over classic WebDriver, so for WebKit the server adds one
// external script to every page that records errors, rejections and CSP violations. The page's own scripts are untouched.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { renderAllPages } from '../src/site/render.ts';
import { SECURITY_HEADERS } from '../src/site/support.ts';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';

const [browserName, executable] = process.argv.slice(2);
if (!['firefox', 'webkit'].includes(browserName) || !executable) {
  console.error('usage: browser-check.mjs <firefox|webkit> <browser binary>');
  process.exit(2);
}
const root = resolve(import.meta.dirname, '..', 'dist');
const require = createRequire(resolve(process.env.PUPPETEER_DIR || process.cwd(), 'package.json'));

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.gz': 'application/gzip',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
const captureScript = `(() => {
  const top = window.top;
  top.__captureInstalled = true;
  const log = (kind, text) => { (top.__capture = top.__capture || []).push({ kind, text: String(text) }); };
  window.addEventListener('error', (e) => log('error', e.message + ' @ ' + e.filename));
  window.addEventListener('unhandledrejection', (e) => log('rejection', e.reason));
  document.addEventListener('securitypolicyviolation', (e) => log('csp', e.violatedDirective + ' ' + e.blockedURI));
  const original = console.error;
  console.error = (...args) => { log('console.error', args.join(' ')); original.apply(console, args); };
})();`;

const served = [];
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (path === '/__capture.js') {
    response.setHeader('content-type', 'text/javascript');
    response.end(captureScript);
    return;
  }
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  const ok = file.startsWith(root) && existsSync(file) && statSync(file).isFile();
  served.push({ path, status: ok ? 200 : 404 });
  if (!ok) {
    response.statusCode = 404;
    response.end('not found');
    return;
  }
  for (const [name, value] of SECURITY_HEADERS) response.setHeader(name, value);
  response.setHeader('content-type', types[extname(file)] || 'application/octet-stream');
  let body = readFileSync(file);
  if (browserName === 'webkit' && file.endsWith('.html')) {
    body = Buffer.from(
      body
        .toString('utf8')
        .replace(
          /(<meta http-equiv="Content-Security-Policy"[^>]*>)/,
          '$1\n<script src="/__capture.js"></script>',
        ),
    );
  }
  response.end(body);
});
await new Promise((done) => server.listen(4291, '127.0.0.1', done));
const base = 'http://127.0.0.1:4291';

const pages = renderAllPages().map((p) => ({
  path: '/' + p.file.replace(/index\.html$/, ''),
  lang: p.lang,
  kind: p.kind,
}));
pages.push({ path: '/calculator.html', lang: 'en', kind: 'calculator' });
const romFile = join(mkdtempSync(join(tmpdir(), 'vertex-')), 'synthetic.rom');
writeFileSync(romFile, buildSyntheticRom());

const report = [];
let failures = 0;
const record = (name, problems) => {
  report.push({ name, problems });
  if (problems.length) failures++;
  console.log(
    `${problems.length ? 'FAIL' : 'ok  '} ${name}${problems.length ? '\n     ' + problems.join('\n     ') : ''}`,
  );
};

async function runFirefox() {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({
    browser: 'firefox',
    executablePath: executable,
    headless: true,
    protocol: 'webDriverBiDi',
  });
  console.log('browser:', await browser.version());
  for (const target of pages) {
    const page = await browser.newPage();
    const problems = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message ?? error}`));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['data:', 'blob:', 'about:'].includes(url.protocol) && url.origin !== base)
        problems.push(`third-party request: ${request.url()}`);
    });
    await page.goto(base + target.path, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang !== (target.lang === 'en' ? 'en' : target.lang)) problems.push(`html lang is ${lang}`);
    if (target.kind === 'home') {
      const frame = page.frames().find((f) => f.url().includes('calculator.html'));
      if (!frame || !(await frame.$('.calc-body'))) problems.push('calculator iframe did not render');
    }
    record(`firefox ${target.path}`, problems);
    await page.close();
  }

  // The emulator pipeline in Firefox: ROM panel, worker, WebAssembly, IndexedDB, keys, zoom.
  const page = await browser.newPage();
  const problems = [];
  page.on(
    'console',
    (message) => message.type() === 'error' && problems.push(`console error: ${message.text()}`),
  );
  page.on('pageerror', (error) => problems.push(`page error: ${error.message ?? error}`));
  await page.goto(base + '/calculator.html', { waitUntil: 'networkidle0' });
  const input = await page.waitForSelector('[data-testid="rom-input"]');
  await input.uploadFile(romFile);
  await page
    .waitForSelector('.calc-body[data-phase="running"]', { timeout: 20000 })
    .catch(() => problems.push('calculator did not reach the running phase'));
  const press = async (key) => {
    const box = await (await page.$(`[data-key="${key}"]`)).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await new Promise((r) => setTimeout(r, 250));
    const during = await page.$eval('.keypad', (el) => el.getAttribute('data-matrix'));
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 250));
    const after = await page.$eval('.keypad', (el) => el.getAttribute('data-matrix'));
    return { during, after };
  };
  await page.evaluate(() => document.querySelector('[data-key="ENTER"]').scrollIntoView());
  const enter = await press('ENTER');
  if (enter.during !== '0000000000000100' || enter.after !== '0000000000000000')
    problems.push(`ENTER key: ${JSON.stringify(enter)}`);
  await page.evaluate(() => document.querySelector('[data-key="ON"]').scrollIntoView());
  const on = await press('ON');
  if (on.during !== '0000010000000000' || on.after !== '0000000000000000')
    problems.push(`ON key: ${JSON.stringify(on)}`);
  await page.click('#zoom_controls button:last-child');
  await page.click('#zoom_controls button:last-child');
  const zoom = await page.$eval('#zoom_level', (el) => el.textContent);
  if (zoom !== '120%') problems.push(`zoom ${zoom}`);
  await page.reload({ waitUntil: 'networkidle0' });
  await page
    .waitForSelector('.calc-body[data-phase="running"]', { timeout: 20000 })
    .catch(() => problems.push('no boot after reload'));
  const zoomAfter = await page.$eval('#zoom_level', (el) => el.textContent);
  if (zoomAfter !== '120%') problems.push(`zoom after reload ${zoomAfter}`);
  record('firefox emulator pipeline (ROM, boot, 2 keys, zoom, reload)', problems);
  await browser.close();
}

async function runWebKit() {
  const { Builder, By, until } = require('selenium-webdriver');
  const driverProcess = spawn('WebKitWebDriver', ['--port=4444'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1500));
  const driver = await new Builder()
    .usingServer('http://127.0.0.1:4444')
    .withCapabilities({
      browserName: 'MiniBrowser',
      'webkitgtk:browserOptions': { binary: executable, args: ['--automation'] },
    })
    .build();
  const caps = await driver.getCapabilities();
  console.log('browser: WebKitGTK', caps.get('browserVersion'));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    // Self-test: the recorder must see a console.error, or an empty report would mean nothing.
    await driver.get(base + '/calculator.html');
    await driver.executeScript("console.error('selftest')");
    const seen = await driver.executeScript('return window.__capture || []');
    record(
      'webkit recorder self-test (a console.error is captured)',
      seen.some((i) => i.text === 'selftest') ? [] : ['recorder did not capture console.error'],
    );
    for (const target of pages) {
      const before = served.length;
      await driver.get(base + target.path);
      await sleep(1800);
      const problems = [];
      if (!(await driver.executeScript('return window.__captureInstalled === true')))
        problems.push('recorder script did not run');
      const captured = await driver.executeScript('return window.__capture || []');
      for (const item of captured) problems.push(`${item.kind}: ${item.text}`);
      for (const entry of served.slice(before))
        if (entry.status !== 200) problems.push(`HTTP ${entry.status} ${entry.path}`);
      const lang = await driver.executeScript('return document.documentElement.lang');
      if (lang !== target.lang) problems.push(`html lang is ${lang}`);
      if (target.kind === 'home') {
        const frame = await driver.findElement(By.id('calculatorFrame'));
        await driver.switchTo().frame(frame);
        const bodies = await driver.findElements(By.css('.calc-body'));
        if (bodies.length === 0) problems.push('calculator iframe did not render');
        await driver.switchTo().defaultContent();
      }
      record(`webkit ${target.path}`, problems);
    }

    const problems = [];
    await driver.get(base + '/calculator.html');
    await sleep(1000);
    const input = await driver.findElement(By.css('[data-testid="rom-input"]'));
    await driver.executeScript('arguments[0].hidden = false; arguments[0].style.display = "block"', input);
    await input.sendKeys(romFile);
    await driver
      .wait(until.elementLocated(By.css('.calc-body[data-phase="running"]')), 20000)
      .catch(() => problems.push('calculator did not reach the running phase'));
    const matrix = () =>
      driver.executeScript("return document.querySelector('.keypad').getAttribute('data-matrix')");
    const dispatch = (key, type) =>
      driver.executeScript(
        'document.querySelector(`[data-key="${arguments[0]}"]`).dispatchEvent(new PointerEvent(arguments[1], { pointerId: 7, pointerType: "mouse", button: 0, bubbles: true }))',
        key,
        type,
      );
    await dispatch('ENTER', 'pointerdown');
    await sleep(250);
    const down = await matrix();
    await dispatch('ENTER', 'pointerup');
    await sleep(250);
    const up = await matrix();
    if (down !== '0000000000000100' || up !== '0000000000000000')
      problems.push(`ENTER key: ${down} then ${up}`);
    await driver.findElement(By.css('#zoom_controls button:last-child')).click();
    const zoom = await driver.findElement(By.id('zoom_level')).getText();
    if (zoom !== '110%') problems.push(`zoom ${zoom}`);
    await driver.navigate().refresh();
    await driver
      .wait(until.elementLocated(By.css('.calc-body[data-phase="running"]')), 20000)
      .catch(() => problems.push('no boot after reload'));
    const zoomAfter = await driver.findElement(By.id('zoom_level')).getText();
    if (zoomAfter !== '110%') problems.push(`zoom after reload ${zoomAfter}`);
    const captured = await driver.executeScript('return window.__capture || []');
    for (const item of captured) problems.push(`${item.kind}: ${item.text}`);
    record('webkit emulator pipeline (ROM, boot, ENTER key, zoom, reload)', problems);
  } finally {
    await driver.quit();
    driverProcess.kill();
  }
}

try {
  if (browserName === 'firefox') await runFirefox();
  else await runWebKit();
} finally {
  server.close();
  rmSync(join(romFile, '..'), { recursive: true, force: true });
}
console.log(`\n${report.length - failures} of ${report.length} checks passed`);
const thirdParty = report
  .flatMap((r) => r.problems)
  .filter((p) => p.startsWith('third-party') || p.startsWith('csp'));
console.log(`third-party requests or CSP violations: ${thirdParty.length}`);
process.exit(failures ? 1 : 0);
