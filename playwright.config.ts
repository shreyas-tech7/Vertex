import { defineConfig, devices } from '@playwright/test';

// Locally the sandbox can't download Playwright's browsers, so VERTEX_CHROMIUM_PATH may point at any
// Chromium binary. In CI the standard `npx playwright install` browsers are used.
const chromiumPath = process.env.VERTEX_CHROMIUM_PATH;
const launchOptions = chromiumPath
  ? {
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-gpu', '--single-process', '--no-zygote'],
    }
  : {};
const skipWebkit = !!process.env.VERTEX_SKIP_WEBKIT;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
    ...(skipWebkit ? [] : [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]),
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
