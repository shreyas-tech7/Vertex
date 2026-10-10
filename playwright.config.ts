import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Chromium comes from Playwright's own install in CI. Where that download is blocked, VERTEX_CHROMIUM_PATH may point
 * at any Chromium binary, and `scripts/fetch-chromium.mjs` prepares one from an npm package into .cache/chromium.
 */
const cachedChromium = resolve(import.meta.dirname, '.cache', 'chromium', 'chromium.sh');
const chromiumPath =
  process.env.VERTEX_CHROMIUM_PATH ?? (existsSync(cachedChromium) ? cachedChromium : undefined);
const launchOptions = chromiumPath
  ? { executablePath: chromiumPath, args: ['--no-sandbox', '--disable-gpu'] }
  : {};

/**
 * WebKit needs Playwright's own build, which only `npx playwright install webkit` can provide. When it is missing
 * the WebKit projects are left out rather than failing every test: a project that cannot run is not evidence.
 * `docs/VERIFICATION.md` records which projects actually ran.
 */
function browsersDirectory(): string {
  return process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), '.cache', 'ms-playwright');
}

function hasPlaywrightBrowser(name: string): boolean {
  try {
    return readdirSync(browsersDirectory()).some((entry) => entry.startsWith(`${name}-`));
  } catch {
    return false;
  }
}

const hasWebkit = !!process.env.VERTEX_FORCE_WEBKIT || hasPlaywrightBrowser('webkit');
if (!hasWebkit) {
  console.warn(
    'Playwright WebKit is not installed, so the webkit, ipad and iphone projects are left out. ' +
      'Run `npx playwright install webkit` where the download is allowed, then re-run to cover them.',
  );
}

const skipFirefox = !!process.env.VERTEX_SKIP_FIREFOX;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
    ...(skipFirefox ? [] : [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]),
    // The Safari engine on a Mac. It is WebKit, not real Safari, and docs/VERIFICATION.md says so.
    ...(hasWebkit
      ? [
          { name: 'webkit', use: { ...devices['Desktop Safari'], launchOptions: {} } },
          {
            name: 'webkit-ipad',
            use: { ...devices['iPad (gen 7)'], isMobile: true, hasTouch: true, launchOptions: {} },
          },
          {
            name: 'webkit-iphone',
            use: { ...devices['iPhone 13'], isMobile: true, hasTouch: true, launchOptions: {} },
          },
        ]
      : []),
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
