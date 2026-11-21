import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel } from '../src/state/model';
import levels from '../src/data/campaign';
import { mechanicIds } from '../src/engine/mechanics';
import { passStudio } from './studio-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8127/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript({ content: 'window.__name=value=>value;' });
  const labels = ['Annuler', 'Recommencer', 'Mélanger', 'Indice'];
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const toolbar = page.getByTestId('game-actions');
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  mkdirSync('test-results', { recursive: true });
  await page.goto(url);
  const seed = async (id: number) => {
    const base = {
      ...initial(),
      started: true,
      guideSeen: true,
      nickname: 'Camille',
      seenMechanics: [...mechanicIds],
    };
    base.settings = { ...base.settings, motion: false, music: false, sound: false, haptics: false };
    const save = loadLevel({ ...base, testSession: { returnSave: base } }, id);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(new URL('atelier', url).href);
    await passStudio(page);
    await expect(page.getByTestId('page-folio')).toHaveText(`PAGE ${String(id).padStart(2, '0')}`);
    return save;
  };
  try {
    for (const [width, height, id] of [
      [320, 400, 1],
      [320, 568, 1000],
      [360, 640, 32],
      [393, 852, 32],
      [430, 932, 980],
      [768, 1024, 1000],
      [1280, 900, 550],
      [480, 280, 1],
      [568, 320, 32],
      [932, 430, 1000],
    ]) {
      await page.setViewportSize({ width, height });
      await seed(id);
      const before = await saved();
      await expect(toolbar).toBeInViewport();
      await expect(toolbar.getByRole('button')).toHaveCount(4);
      await expect(toolbar.getByTestId('botanical-foliage-frame')).toHaveCount(0);
      const frame = (await toolbar.boundingBox())!;
      const tops: number[] = [];
      let previousRight = 0;
      for (const name of labels) {
        const action = button(name);
        const area = (await action.boundingBox())!;
        expect(area.width).toBeGreaterThanOrEqual(44);
        expect(area.height).toBeGreaterThanOrEqual(44);
        expect(area.x).toBeGreaterThanOrEqual(Math.max(frame.x, previousRight));
        expect(area.x + area.width).toBeLessThanOrEqual(frame.x + frame.width);
        previousRight = area.x + area.width;
        const icon = action.getByTestId(/^workshop-action-icon-/);
        await expect
          .poll(() =>
            icon.evaluate(
              (n) =>
                (n instanceof HTMLImageElement ? n : n.querySelector('img'))?.naturalWidth ?? 0,
            ),
          )
          .toBeGreaterThan(0);
        const iconBounds = (await icon.boundingBox())!;
        expect(iconBounds.y).toBeGreaterThanOrEqual(frame.y + 11);
        expect(iconBounds.y + iconBounds.height).toBeLessThan(frame.y + frame.height);
        const text = action.getByTestId(/^workshop-action-label-/);
        if (await text.count()) {
          const lettering = (await text.boundingBox())!;
          const measurement = await text.evaluate((n) => {
            const range = document.createRange();
            range.selectNodeContents(n);
            return {
              ink: range.getBoundingClientRect().width,
              font: getComputedStyle(n).fontFamily,
            };
          });
          expect(measurement.ink, `${width} px: ${name}`).toBeLessThanOrEqual(
            lettering.width + 0.5,
          );
          expect(measurement.font).toContain('HerbariumMedium');
          expect(lettering.y + lettering.height).toBeLessThanOrEqual(frame.y + frame.height - 11);
          tops.push(lettering.y);
        }
      }
      if (tops.length) expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(0.5);
      expect(await saved()).toEqual(before);
      const fit = await page.evaluate(() => ({
        scroll: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
        height: innerHeight,
      }));
      expect(fit.width).toBeLessThanOrEqual(width);
      expect(fit.scroll).toBeLessThanOrEqual(fit.height + 1);
      await page.screenshot({ path: `test-results/ivory-toolbar-${width}x${height}.png` });
    }
    await page.setViewportSize({ width: 393, height: 852 });
    const save = await seed(1);
    const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
    const pour = async () => {
      const step = levels[0].solution[0];
      await tube(step.from).click();
      await tube(step.to).click();
      await expect.poll(async () => (await saved()).moves).toBe(1);
    };
    await expect(button('Annuler')).toBeDisabled();
    await pour();
    await expect(button('Annuler')).toBeEnabled();
    await button('Annuler').click();
    expect((await saved()).board).toEqual(save.board);
    expect((await saved()).moves).toBe(0);
    await pour();
    await button('Recommencer').click();
    expect((await saved()).board).toEqual(save.board);
    expect((await saved()).moves).toBe(0);
    const bounds = await toolbar.boundingBox();
    await button('Indice').click();
    await expect(page.getByTestId('hint-scroll')).toBeVisible();
    expect((await saved()).seeds).toBe(save.seeds);
    expect(await toolbar.boundingBox()).toEqual(bounds);
    await button('Mélanger').click();
    await expect(page.getByTestId('workshop-confirm')).toBeVisible();
    await button('Continuer à chercher').click();
    expect((await saved()).board).toEqual(save.board);
    await button('Mélanger').click();
    await button('Mélanger gratuitement').click();
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    await expect.poll(async () => !!(await saved()).remix).toBe(true);
    expect((await saved()).seeds).toBe(save.seeds);
    await button('Recommencer').click();
    expect((await saved()).board).toEqual(save.board);
    await expect(button('Annuler')).toBeDisabled();
    expect(errors).toEqual([]);
    console.log(
      'Ivory toolbar passed: 10 phone/tablet/landscape formats, page 32 and mixed page 1000, four separated 44-point targets, loaded artwork, aligned untruncated upright labels, no scroll, unchanged view-only saves, undo/restart/free hint and mix cancel/confirm.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
