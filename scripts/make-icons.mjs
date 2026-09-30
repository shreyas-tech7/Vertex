// Renders the original Vertex icons and social preview image to /public using a headless Chromium.
// Usage: VERTEX_CHROMIUM_PATH=/path/to/chromium node scripts/make-icons.mjs   (or plain `npx playwright install chromium` first)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const executablePath = process.env.VERTEX_CHROMIUM_PATH || undefined;
mkdirSync('public', { recursive: true });

const icon = (size, padding) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3040"/><stop offset="1" stop-color="#12151c"/></linearGradient>
    <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d3b0"/><stop offset="1" stop-color="#97b48f"/></linearGradient>
  </defs>
  <rect width="64" height="64" rx="${padding ? 0 : 14}" fill="url(#bg)"/>
  <g transform="translate(32 32) scale(${1 - padding}) translate(-32 -32)">
    <rect x="9" y="8" width="46" height="28" rx="4" fill="url(#lcd)" stroke="#0b0d12" stroke-width="1.5"/>
    <path d="M15 14 L32 32 L49 14" fill="none" stroke="#1d2b22" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="2.2" fill="#ffb000"/>
    <g fill="#e8ecf4"><circle cx="18" cy="46" r="4"/><circle cx="46" cy="46" r="4"/><circle cx="18" cy="57" r="3"/><circle cx="32" cy="57" r="3"/><circle cx="46" cy="57" r="3"/></g>
    <circle cx="32" cy="46" r="4" fill="#4fd1ff"/>
    <circle cx="4" cy="4" r="0"/>
  </g>
</svg>`;

const og = `
<html><body style="margin:0;width:1200px;height:630px;background:radial-gradient(1200px 700px at 75% 20%,#2b3550,#0d0f14);font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;color:#e8ecf4;display:flex;align-items:center;">
  <div style="padding:0 80px;flex:1">
    <div style="font-size:26px;letter-spacing:.35em;color:#ffb000;text-transform:uppercase">Free · Offline · No ads</div>
    <div style="font-size:140px;font-weight:800;letter-spacing:-.02em;line-height:1.05">Vertex</div>
    <div style="font-size:40px;opacity:.85;line-height:1.3;margin-top:8px">A graphing calculator that works like the one in your backpack.</div>
    <div style="font-size:24px;opacity:.6;margin-top:30px;white-space:nowrap">TI-84 Plus compatible keys, menus and programs</div>
  </div>
  <div style="width:380px;height:520px;margin-right:70px;border-radius:40px;background:linear-gradient(#323a4e,#151923);box-shadow:0 30px 80px #000c,inset 0 2px 0 #fff3;padding:26px;box-sizing:border-box">
    <svg viewBox="0 0 96 64" width="328" height="218" style="display:block;border-radius:10px;background:#a9c4a0;border:4px solid #0b0d12;box-sizing:border-box;width:328px;height:218px">
      <g stroke="#1d2b22" stroke-width="1" fill="none" shape-rendering="crispEdges"><path d="M0 31.5H95M47.5 0V63" opacity=".6"/></g>
      <path d="${Array.from({ length: 95 }, (_, px) => {
        const x = (px - 47) / 4.7;
        const py = Math.round(31 - ((x * x) / 5) * 3.1);
        return `${px === 0 ? 'M' : 'L'}${px + 0.5} ${Math.max(-2, py) + 0.5}`;
      }).join(' ')}" fill="none" stroke="#1d2b22" stroke-width="1.6" shape-rendering="crispEdges"/>
    </svg>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:26px">
      ${Array.from({ length: 25 }, (_, i) => `<div style="height:34px;border-radius:9px;background:${i === 5 ? '#ffb000' : i === 10 ? '#4fd1ff' : i > 14 && i % 5 === 4 ? '#3b4358' : '#e8ecf4'};opacity:${i < 5 ? 0.6 : 1}"></div>`).join('')}
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-gpu'] });
async function shot(html, file, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: file, omitBackground: false });
  await page.close();
  console.log('wrote', file);
}
const wrap = (svg) => `<html><body style="margin:0;background:transparent">${svg}</body></html>`;
await shot(wrap(icon(192, 0)), 'public/icon-192.png', 192, 192);
await shot(wrap(icon(512, 0)), 'public/icon-512.png', 512, 512);
await shot(wrap(icon(180, 0)), 'public/apple-touch-icon.png', 180, 180);
await shot(wrap(icon(512, 0.18)), 'public/icon-maskable-512.png', 512, 512);
await shot(og, 'public/og-image.png', 1200, 630);
await browser.close();
