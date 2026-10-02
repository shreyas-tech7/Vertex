// Renders Vertex's original icons, the landing-page preview and the social image to /public with a headless Chromium.
// Needs the built site served on BASE_URL (default http://localhost:4173, e.g. `npx vite preview --port 4173`).
// Usage: VERTEX_CHROMIUM_PATH=/path/to/chromium node scripts/make-assets.mjs
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:4173';
const executablePath = process.env.VERTEX_CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-gpu'] });

const mark = (size, inset) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${inset ? 0 : 14}" fill="#000"/>
  <g transform="translate(32 32) scale(${inset ? 0.72 : 1}) translate(-32 -32)">
    <path d="M17 17 L32 46 L47 17" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="51" r="2.6" fill="#fff"/>
  </g>
</svg>`;

async function shotHtml(html, file, width, height, scale = 1) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(`<html><body style="margin:0;background:transparent">${html}</body></html>`);
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
  console.log('wrote', file);
}

await shotHtml(mark(192, false), 'public/icon-192.png', 192, 192);
await shotHtml(mark(512, false), 'public/icon-512.png', 512, 512);
await shotHtml(mark(512, true), 'public/icon-maskable-512.png', 512, 512);
await shotHtml(mark(180, true), 'public/apple-touch-icon.png', 180, 180);

// Preview: the calculator exactly as a first-time visitor sees it, at twice the size for sharp edges.
const calculator = await browser.newPage({ viewport: { width: 500, height: 900 }, deviceScaleFactor: 2 });
await calculator.goto(`${base}/calculator.html`);
await calculator.locator('.rom-panel').waitFor();
await calculator.waitForTimeout(400);
await calculator.locator('.calc-body').screenshot({ path: 'public/preview.png', omitBackground: true });
await calculator.close();
console.log('wrote public/preview.png');

// Social image: white page, the name, one honest line, the preview.
const preview = (await import('node:fs')).readFileSync('public/preview.png').toString('base64');
await shotHtml(
  `<div style="width:1200px;height:630px;background:#fff;display:flex;align-items:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333">
     <div style="padding:0 90px;flex:1">
       <div style="font-size:120px;font-weight:700;color:#000;line-height:1.05">Vertex</div>
       <div style="font-size:40px;line-height:1.35;margin-top:16px;color:#555">A free TI-84 Plus CE calculator in your browser.</div>
       <div style="font-size:26px;margin-top:28px;color:#666">Real TI-OS. Your own ROM. Nothing leaves your device.</div>
     </div>
     <img src="data:image/png;base64,${preview}" style="height:520px;margin-right:110px;border:1px solid #e0e0e0;border-radius:24px">
   </div>`,
  'public/og-image.png',
  1200,
  630,
);
await browser.close();
