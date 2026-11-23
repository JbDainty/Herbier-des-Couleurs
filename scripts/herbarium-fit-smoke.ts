import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { passStudio } from './studio-test-helper';
import { chapters } from '../src/data/botany';
import { herbariumLayout } from '../src/layout/herbarium';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  await page.addInitScript({ content: 'window.__name = value => value;' });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = process.env.GAME_TEST_URL || 'http://localhost:8171/';
  const full: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    seeds: 27,
    completed: {},
    pigments: [],
  };
  full.settings = { ...full.settings, motion: false, sound: false, music: false };
  for (let id = 1; id <= 1000; id++) {
    full.completed[id] = { stars: 3, date: '2026-11-11T12:00:00Z' };
    full.pigments.push(discoverPigment(id, '2026-11-11T12:00:00Z'));
  }
  const stored = () => page.evaluate(() => localStorage.getItem('color-world.save'));
  const seed = async (motion = false) => {
    await page.goto(base);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), {
      ...full,
      settings: { ...full.settings, motion },
    });
    await page.goto(base + 'herbier');
    await passStudio(page);
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
  };
  const fit = async (width: number, height: number) => {
    const doc = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    expect(doc.w).toBeLessThanOrEqual(width);
    expect(doc.h).toBeLessThanOrEqual(height + 1);
    const actions = await page.getByRole('button').all();
    for (const button of actions) {
      if (!(await button.isVisible())) continue;
      const b = (await button.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(-0.5);
      expect(b.y).toBeGreaterThanOrEqual(-0.5);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 0.5);
      expect(b.width).toBeGreaterThanOrEqual(43.9);
      expect(b.height).toBeGreaterThanOrEqual(43.9);
    }
    await page.mouse.wheel(0, 700);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await seed();
    const saved = await stored();
    for (const [width, height] of [
      [320, 400],
      [320, 568],
      [360, 640],
      [412, 915],
      [768, 1024],
      [1024, 1366],
      [932, 430],
      [480, 280],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(
        page.getByRole('button', { name: /Les planches|Pigments et sceaux/ }),
      ).toHaveCount(0);
      const layout = herbariumLayout(width, height);
      await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(
        layout.booksPerPage,
      );
      await fit(width, height);
      expect(await page.locator('[aria-label^="Planche de "]').count()).toBe(0);
      await page.screenshot({ path: `test-results/herbarium-fit-${width}x${height}.png` });
      const count = Math.ceil(chapters.length / layout.booksPerPage) + 1;
      const indicator = page.getByTestId('herbarium-shelf-page');
      const next = page.getByRole('button', { name: 'Suite', exact: true });
      const prev = page.getByRole('button', { name: 'Avant', exact: true });
      await expect(prev).toBeDisabled();
      for (let spread = 1; spread <= count; spread++) {
        await expect(indicator).toHaveText(`${spread} / ${count}`);
        await expect(indicator).toHaveAccessibleName(`Page ${spread} sur ${count}`);
        if (spread < count) {
          await expect(
            page.getByTestId(`herbarium-book-${(spread - 1) * layout.booksPerPage}`),
          ).toBeVisible();
          if (spread === 2 && width === 412)
            await page.screenshot({ path: 'test-results/herbarium-second-shelf.png' });
          await next.click();
        }
      }
      await expect(page.getByTestId('golden-herbarium-book')).toBeVisible();
      await expect(next).toBeDisabled();
      await fit(width, height);
      if (width === 412) await page.screenshot({ path: 'test-results/herbarium-golden-shelf.png' });
      await prev.click();
      await expect(indicator).toHaveText(`${count - 1} / ${count}`);
      await page.getByRole('button', { name: 'Voir l’Herbier des Merveilles' }).click();
      await page.getByRole('button', { name: 'Retrouver les carnets des écosystèmes' }).click();
      await expect(indicator).toHaveText(`1 / ${count}`);
      expect(await stored()).toBe(saved);
    }
    // Every ecosystem, including the longest titles, stays inside its binding.
    await page.setViewportSize({ width: 320, height: 568 });
    await seed();
    const ink: unknown[] = [];
    for (let shelf = 0; shelf < 5; shelf++) {
      const samples = await page
        .locator('[data-testid^="antique-cover-title-"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const ink = range.getBoundingClientRect(),
              box = node.getBoundingClientRect();
            const splitWords: string[] = [];
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const text = walker.currentNode;
              for (const match of (text.textContent ?? '').matchAll(/\S+/g)) {
                range.setStart(text, match.index);
                range.setEnd(text, match.index + match[0].length);
                if (range.getClientRects().length > 1) splitWords.push(match[0]);
              }
            }
            return {
              name: node.textContent,
              splitWords,
              inkHeight: ink.height,
              boxHeight: box.height,
              inkWidth: ink.width,
              boxWidth: box.width,
            };
          }),
        );
      ink.push(...samples);
      for (const s of samples) {
        expect(s.splitWords, s.name!).toEqual([]);
        expect(s.inkHeight, s.name!).toBeLessThanOrEqual(s.boxHeight + 1);
        expect(s.inkWidth, s.name!).toBeLessThanOrEqual(s.boxWidth + 1);
      }
      if (shelf < 4) await page.getByRole('button', { name: 'Suite', exact: true }).click();
    }
    writeFileSync('test-results/herbarium-title-ink.json', JSON.stringify(ink, null, 2));
    await page.screenshot({ path: 'test-results/herbarium-last-shelf-small.png' });
    await page.setViewportSize({ width: 412, height: 915 });
    await seed(true);
    const unchanged = await stored();
    await page
      .getByRole('button', { name: /^Ouvrir le carnet / })
      .last()
      .dispatchEvent('click');
    await expect(page.getByTestId('antique-book-opening')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 400 });
    await expect(page.getByTestId('antique-book-opening')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(2);
    await page.waitForTimeout(450);
    await expect(page.getByTestId('ecosystem-album')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Ouvrir le carnet / }).first()).toBeEnabled();
    await page.setViewportSize({ width: 412, height: 915 });
    const first = page.getByRole('button', { name: /^Ouvrir le carnet / }).first();
    await first.dispatchEvent('click');
    await first.dispatchEvent('click');
    await expect(page.getByTestId('ecosystem-album')).toBeVisible();
    expect(await stored()).toBe(unchanged);
    await page.getByRole('button', { name: 'Carnets', exact: true }).click();
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
    await page
      .getByRole('button', { name: /^Ouvrir le carnet / })
      .first()
      .click();
    await expect(page.getByTestId('antique-book-opening')).toBeVisible();
    await page.getByRole('button', { name: 'Menu principal', exact: true }).dispatchEvent('click');
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.waitForTimeout(450);
    await expect(page.getByTestId('ecosystem-album')).toHaveCount(0);
    expect(await stored()).toBe(unchanged);
    expect(errors).toEqual([]);
    console.log(
      'Herbarium viewport passed: all spreads without scrolling on eight phone/tablet/landscape sizes; 44-point controls; all twenty titles inside bindings; adaptive pagination; existing saves; rapid taps and cancellation during opening; unchanged save.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
