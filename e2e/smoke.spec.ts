import { expect, test } from '@playwright/test';

test('the calculator face loads with a screen and 50 keys', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Vertex/);
  await expect(page.getByLabel('Calculator screen')).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(50);
});
