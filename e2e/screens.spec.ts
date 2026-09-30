import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Writes screenshots to ./screenshots (git-ignored) so a human (or the agent) can look at the real page.
test('screenshots of the calculator face', async ({ page }, info) => {
  mkdirSync('screenshots', { recursive: true });
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/home-${info.project.name}.png`, fullPage: true });
});
