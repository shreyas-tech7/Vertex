import { LANGS } from '../src/site/i18n/types.ts';
import { STRINGS } from '../src/site/i18n/index.ts';
import { renderAllPages } from '../src/site/render.ts';
import { expect, test } from './support.ts';

const pages = renderAllPages();
const urlOf = (file: string) => '/' + file.replace(/index\.html$/, '');

test.describe('every page loads cleanly', () => {
  for (const page of pages) {
    test(`${page.file}: no console errors, no third-party requests, right language`, async ({
      page: browser,
    }) => {
      await browser.goto(urlOf(page.file));
      await browser.waitForLoadState('networkidle');
      await expect(browser.locator('html')).toHaveAttribute('lang', STRINGS[page.lang].htmlLang);
      await expect(browser.locator('h1').first()).toBeVisible();
      await expect(browser.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
      if (page.kind === 'home') {
        const frame = browser.frameLocator('#calculatorFrame');
        await expect(frame.locator('.calc-body')).toBeVisible();
        await expect(
          frame.getByRole('heading', {
            name: STRINGS[page.lang].calc.romHeading.replace('{brand}', 'Vertex'),
          }),
        ).toBeVisible();
      }
    });
  }

  test('calculator.html opens directly', async ({ page }) => {
    await page.goto('/calculator.html');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.calc-body')).toBeVisible();
    await expect(page.locator('#zoom_controls')).toBeVisible();
  });
});

test.describe('language dropdown', () => {
  for (const page of pages.filter((p) => p.kind === 'home')) {
    test(`${page.lang}: every dropdown link works`, async ({ page: browser, request }) => {
      await browser.goto(urlOf(page.file));
      await browser.locator('.lang-menu summary').click();
      const links = browser.locator('.lang-menu a');
      await expect(links).toHaveCount(9);
      for (let i = 0; i < 9; i++) {
        const href = await links.nth(i).getAttribute('href');
        const response = await request.get(new URL(href!, browser.url()).toString());
        expect(response.status(), `${page.lang} -> ${href}`).toBe(200);
        expect(await links.nth(i).getAttribute('hreflang')).toBe(LANGS[i]);
      }
    });
  }

  test('choosing a language opens that version, and the iframe follows', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang-menu summary').click();
    await page.getByRole('link', { name: 'Français' }).click();
    await expect(page).toHaveURL(/\/fr\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const frame = page.frameLocator('#calculatorFrame');
    await expect(frame.getByRole('heading', { name: 'Chargez votre ROM TI-84 Plus CE' })).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Choisir un fichier ROM' })).toBeVisible();
  });

  test('the menu closes on Escape and on an outside click', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.lang-menu');
    await menu.locator('summary').click();
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await menu.locator('summary').click();
    await page.locator('.content').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveAttribute('open', '');
  });
});

test.describe('landing page', () => {
  test('footer links reach the privacy page, the terms page and the source archive', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('Emulation by CEmu (GPLv3)');
    await expect(footer).toContainText('TI-84 Plus CE is a trademark of Texas Instruments');
    await expect(footer).not.toContainText(/contact/i);
    for (const name of ['Privacy Policy', 'Terms of Service', 'Get the source code']) {
      const href = await footer.getByRole('link', { name }).getAttribute('href');
      const response = await request.get(new URL(href!, page.url()).toString());
      expect(response.status(), name).toBe(200);
    }
    const archive = await request.get(new URL('source/vertex-emulator-source.tar.gz', page.url()).toString());
    expect((await archive.body()).byteLength).toBeGreaterThan(1_000_000);
  });

  test('"Back to Calculator" scrolls to the top', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cta-button').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await page.locator('.cta-button').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('the privacy page says plainly that the ROM, the saved state and settings stay in the browser', async ({
    page,
  }) => {
    await page.goto('/privacy/');
    const text = (await page.locator('.content').innerText()).replace(/\s+/g, ' ');
    expect(text).toContain('Your calculator ROM, the saved state of the calculator, and your settings');
    expect(text).toContain('They never leave your device');
  });
});

test.describe('iframe sizing', () => {
  test('the iframe grows and shrinks with the calculator zoom', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator('#calculatorFrame');
    const frame = page.frameLocator('#calculatorFrame');
    const heightAt = async () =>
      Number.parseFloat((await iframe.evaluate((el) => (el as HTMLIFrameElement).style.height)) || '0');

    // 100%: the page reports controls + 738px + the lines under the calculator.
    await expect.poll(heightAt).toBeGreaterThan(800);
    const at100 = await heightAt();

    const plus = frame.getByRole('button', { name: 'Zoom in' });
    for (let i = 0; i < 10; i++) await plus.click();
    await expect.poll(heightAt).toBeGreaterThan(at100 + 700);
    const at200 = await heightAt();
    expect(at200).toBeCloseTo(at100 + 738, -1);

    const minus = frame.getByRole('button', { name: 'Zoom out' });
    for (let i = 0; i < 15; i++) await minus.click();
    await expect.poll(heightAt).toBeLessThan(at100 - 300);
    expect(await heightAt()).toBeCloseTo(at100 - 369, -1);
  });

  test('zoom survives a reload of the landing page', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('#calculatorFrame');
    await frame.getByRole('button', { name: 'Zoom in' }).click();
    await frame.getByRole('button', { name: 'Zoom in' }).click();
    await expect(frame.locator('#zoom_level')).toHaveText('120%');
    await page.reload();
    await expect(frame.locator('#zoom_level')).toHaveText('120%');
  });

  test('a height message from anything but our own iframe is ignored', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator('#calculatorFrame');
    await expect.poll(() => iframe.evaluate((el) => (el as HTMLIFrameElement).style.height)).not.toBe('');
    const before = await iframe.evaluate((el) => (el as HTMLIFrameElement).style.height);
    await page.evaluate(() => window.postMessage({ type: 'updateHeight', height: 3333 }, '*'));
    await page.waitForTimeout(300);
    expect(await iframe.evaluate((el) => (el as HTMLIFrameElement).style.height)).toBe(before);
  });
});
