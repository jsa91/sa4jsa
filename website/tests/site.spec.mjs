import { test, expect } from '@playwright/test';

const files = ['index.html', 'chapter-1-sinusvagen.html', 'chapter-2-tid-och-frekvensdoman.html', 'chapter-3-frekvensspektrumet.html', 'chapter-4-signal-till-brus.html', 'chapter-5-kapacitet.html'];

test.beforeEach(async ({ context, baseURL }) => {
  const externalRequests = [];
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== new URL(baseURL).origin) {
      externalRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  context.on('close', () => expect(externalRequests, 'No external assets should be requested').toEqual([]));
});

test('all pages preserve content, local assets, math and working navigation', async ({ page, request, baseURL }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const failures = [];
  page.on('response', (response) => { if (response.status() >= 400) failures.push(response.url()); });
  for (const [i, file] of files.entries()) {
    await page.goto(file);
    await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.chapters a')).toHaveCount(6);
    await expect(page.locator('.chapters [aria-current="page"]')).toHaveAttribute('href', file);
    await expect(page.locator('details')).toHaveCount(0);
    await expect(page.locator('.katex-error')).toHaveCount(0);
    if (i > 0 && i !== 3) await expect(page.locator('.katex').first()).toBeVisible();
    await expect(page.locator('article')).not.toContainText('![');
    if (i === 4) await expect(page.locator('table')).toHaveCount(2);
    if (i === 5) await expect(page.locator('table')).toHaveCount(1);
    expect(await page.locator('article img').evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => !/^https?:/.test(href)));
    for (const href of new Set(hrefs)) {
      const target = new URL(href, new URL(file, baseURL));
      const response = await request.get(target.href);
      expect(response.ok(), target.href).toBe(true);
      if (target.hash) expect(await response.text()).toContain(`id="${target.hash.slice(1)}"`);
    }
    if (i === 1 || i === 2) {
      await expect(page.locator('.plot').first()).toBeVisible();
      await page.locator('.demo').screenshot({ path: testInfo.outputPath(`chapter-${i}-demo.png`) });
    }
  }
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});

test('sine controls update immediately, support the keyboard, and reset on reload', async ({ page }) => {
  await page.goto(files[1]);
  const path = page.locator('.signal-path');
  await expect(path).toHaveCount(1);
  const original = await path.getAttribute('d');
  await page.locator('#amplitude').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#amplitude-value')).toHaveText('1,1');
  await expect(path).not.toHaveAttribute('d', original);
  await expect(page.locator('.plot svg')).toHaveAttribute('data-y-max', '5');
  await page.locator('#phase').focus();
  await page.keyboard.press('End');
  expect(Number(await page.locator('#phase').inputValue())).toBeCloseTo(Math.PI, 12);
  await expect(page.locator('#phase-value')).toHaveText('3,14 rad');
  await page.getByRole('button', { name: 'Återställ' }).click();
  await expect(path).toHaveAttribute('d', original);
  await page.locator('#frequency').fill('2.5');
  await expect(path).not.toHaveAttribute('d', original);
  await page.reload();
  await expect(path).toHaveAttribute('d', original);
});

test('domain controls change count and curves, retain axes, and reset all signals', async ({ page }) => {
  await page.goto(files[2]);
  await expect(page.locator('#signal-count')).toHaveValue('1');
  await expect(page.locator('.signal-path')).toHaveCount(2);
  const original = await page.locator('.signal-path').first().getAttribute('d');
  await page.locator('#signal-count').selectOption('4');
  await expect(page.locator('.signal-path')).toHaveCount(8);
  await page.locator('#signal-count').selectOption('1');
  await expect(page.locator('.signal-path')).toHaveCount(2);
  await expect(page.locator('fieldset:visible')).toHaveCount(1);
  await expect(page.locator('#amplitude-2')).toBeDisabled();
  await page.locator('#frequency-1').fill('7.5');
  await expect(page.locator('#frequency-1-value')).toHaveText('7,5 Hz');
  await expect(page.locator('.signal-path').first()).not.toHaveAttribute('d', original);
  await page.locator('#amplitude-1').fill('0');
  await expect(page.locator('#amplitude-1-value')).toHaveText('0');
  await expect(page.locator('.plot svg').last()).toHaveAttribute('data-y-max', '3000');
  await expect(page.locator('.plot svg').last()).toHaveAttribute('data-x-max', '25');
  await page.getByRole('button', { name: 'Återställ' }).click();
  await expect(page.locator('#signal-count')).toHaveValue('1');
  await expect(page.locator('.signal-path')).toHaveCount(2);
  await expect(page.locator('.signal-path').first()).toHaveAttribute('d', original);
  await expect(page.locator('#frequency-1')).toHaveValue('5');
});

test('narrow screens contain plots and tables without page overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const file of files) {
    await page.goto(file);
    if (file === files[1] || file === files[2]) await expect(page.locator('.plot').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), file).toBe(true);
  }
  await page.goto(files[1]);
  await page.locator('#amplitude').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#amplitude-value')).toHaveText('1,1');
  await page.screenshot({ path: testInfo.outputPath('mobile-lecture.png'), fullPage: true });
});

test('lecture content and static images remain readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(new URL(files[1], baseURL).href);
  await expect(page.locator('h1')).toHaveText('Sinusvågen');
  await expect(page.locator('.demo-app')).toContainText('Aktivera JavaScript');
  await expect(page.locator('img[alt="Sinusvåg"]')).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  await context.close();
});
