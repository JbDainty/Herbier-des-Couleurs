import { requestHint } from './hint-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/campaign';
import { mechanicIds } from '../src/engine/mechanics';
import { pour } from '../src/engine/puzzle';
import { passStudio } from './studio-test-helper';
import { openCarnet, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mkdirSync('test-results', { recursive: true });
  const seal = page.getByTestId('mistake-seal-note');
  const text = page.getByTestId('mistake-seal-text');
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n},`) });
  const seed = async (motion: boolean, mismatch = false) => {
    let save = { ...initial(), started: true };
    if (mismatch) save = move(save, 1, 0);
    save.settings = { ...save.settings, motion, sound: false, music: false, haptics: false };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(seal).toHaveCount(0);
  };
  try {
    await page.goto(url);
    await openCarnet(page);
    await seed(true);
    const saveBefore = await page.evaluate(() => localStorage.getItem('color-world.save'));
    const boardBefore = (await page.getByTestId('liquid-board-idle').boundingBox())!;
    await tube(1).click();
    await tube(2).click(); // A full destination cannot accept another pigment.
    await expect(seal).toBeVisible();
    await expect(text).toHaveText('Versez sur une couleur identique\nou dans un flacon vide.');
    await expect(page.getByTestId('mistake-seal-firefly')).toHaveCount(6);
    const drifting = page.getByTestId('mistake-seal-firefly').first();
    const first = await drifting.evaluate((n) => getComputedStyle(n).transform);
    await expect
      .poll(() => drifting.evaluate((n) => getComputedStyle(n).transform))
      .not.toBe(first);
    expect(await text.evaluate((n) => getComputedStyle(n).fontFamily)).toContain(
      'HerbariumScientific',
    );
    const textBefore = (await text.boundingBox())!;
    await page.waitForTimeout(1000);
    const textAfter = (await text.boundingBox())!;
    expect(textAfter.x).toBeCloseTo(textBefore.x, 1);
    expect(textAfter.y).toBeCloseTo(textBefore.y, 1);
    await page.screenshot({ path: 'test-results/mistake-seal-mobile.png', fullPage: true });
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saveBefore);
    const boardAfter = (await page.getByTestId('liquid-board-idle').boundingBox())!;
    expect(boardAfter.y).toBeCloseTo(boardBefore.y, 0);
    expect(boardAfter.height).toBeCloseTo(boardBefore.height, 0);
    // Repeated errors replace the previous effect, whose cleanup must not dismiss the new one.
    await page.waitForTimeout(1000);
    await tube(2).click(); // Deselect; playing remains possible throughout the effect.
    await expect(seal).toHaveCount(0);
    await tube(1).click();
    await tube(2).click();
    await expect(seal).toBeVisible();
    await page.waitForTimeout(4100);
    await expect(seal).toBeVisible();
    await expect(seal).toHaveCount(0, { timeout: 3000 });
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saveBefore);

    await page.setViewportSize({ width: 320, height: 740 });
    await seed(true, true);
    await tube(2).click();
    await tube(3).click(); // Two different top colours cannot be combined.
    await expect(seal).toBeVisible();
    await page.waitForTimeout(1100);
    const noteBox = (await seal.boundingBox())!,
      textBox = (await text.boundingBox())!;
    expect(await text.evaluate((n) => n.clientHeight)).toBeLessThanOrEqual(48);
    expect(textBox.x).toBeGreaterThanOrEqual(noteBox.x);
    expect(textBox.x + textBox.width).toBeLessThanOrEqual(noteBox.x + noteBox.width + 1);
    expect(textBox.y + textBox.height).toBeLessThan(noteBox.y + noteBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await page.screenshot({ path: 'test-results/mistake-seal-narrow.png', fullPage: true });
    await requestHint(page);
    await expect(seal).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toBeVisible();
    await expect(page.getByTestId('hint-pencil')).toBeVisible();
    await page.getByRole('button', { name: 'Recommencer', exact: true }).click();
    await expect(seal).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    await tube(2).click();
    await tube(1).click(); // Valid pours still commit immediately after their animation.
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).moves),
    ).toBe(1);

    await seed(false);
    await tube(1).click();
    await tube(2).click();
    await expect(seal).toBeVisible();
    await expect(page.getByTestId('mistake-seal-still')).toBeVisible();
    await expect(page.getByTestId('mistake-seal-firefly')).toHaveCount(0);
    await expect(page.getByTestId('mistake-seal-animated')).toHaveCount(0);
    await expect(text).toHaveText('Versez sur une couleur identique\nou dans un flacon vide.');
    await page.waitForTimeout(6100);
    await expect(seal).toHaveCount(0);
    await tube(2).click();
    await tube(1).click();
    await tube(2).click();
    await expect(seal).toBeVisible();
    await openScreen(page, 'Paramètres');
    await openScreen(page, 'L’Atelier');
    await expect(seal).toHaveCount(0);
    // Exercise wrapped mechanic messages and a mixed final page on real boards.
    const collector = levels.find((level) =>
      level.rules?.collectors?.some((tube) => level.board[tube].length > 0),
    )!;
    const filtered = levels.find((level) => level.rules?.filters?.length)!;
    const formats = [
      { width: 320, height: 568, level: filtered, family: 'filter' },
      { width: 844, height: 390, level: collector, family: 'collector' },
      { width: 768, height: 1024, level: levels[999], family: 'mixed-1000' },
    ];
    for (const { width, height, level, family } of formats) {
      await page.setViewportSize({ width, height });
      const base = {
        ...initial(),
        started: true,
        guideSeen: true,
        seenMechanics: [...mechanicIds],
      };
      base.settings = {
        ...base.settings,
        motion: false,
        sound: false,
        music: false,
        haptics: false,
      };
      const save = loadLevel({ ...base, testSession: { returnSave: base } }, level.id);
      await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
      await page.goto(new URL('atelier', url).href);
      await passStudio(page);
      await expect(page.getByTestId('page-folio')).toHaveText(
        `PAGE ${String(level.id).padStart(2, '0')}`,
      );
      const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
      let invalid: { from: number; to: number } | undefined;
      for (let from = 0; from < level.board.length && !invalid; from++) {
        if (!level.board[from].length) continue;
        if (family === 'collector' && !level.rules?.collectors?.includes(from)) continue;
        for (let to = 0; to < level.board.length; to++) {
          if (from === to) continue;
          if (family === 'filter' && !level.rules?.filters?.some((f) => f.tube === to)) continue;
          if (!pour(level.board, from, to, level.rules)) {
            invalid = { from, to };
            break;
          }
        }
      }
      expect(invalid, `invalid pour in ${family}`).toBeDefined();
      await tube(invalid!.from + 1).click();
      await tube(invalid!.to + 1).click();
      await expect(seal).toBeVisible();
      if (family === 'collector')
        await expect(text).toContainText('Cette fiole conserve les teintes');
      if (family === 'filter') await expect(text).toContainText('Ce filtre reçoit seulement');
      const frame = (await seal.boundingBox())!;
      const lettering = (await text.boundingBox())!;
      expect(lettering.x).toBeGreaterThanOrEqual(frame.x + 16);
      expect(lettering.x + lettering.width).toBeLessThanOrEqual(frame.x + frame.width - 16);
      expect(lettering.y).toBeGreaterThan(frame.y);
      expect(lettering.y + lettering.height).toBeLessThan(frame.y + frame.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
      await page.screenshot({ path: `test-results/mistake-seal-${family}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
    console.log(
      'Mistake feedback passed: full/different-colour pours show an animated gold botanical seal with stable readable text, auto-dismiss, rapid replacement cleanup, stable rack geometry and unchanged save; input/hints/restart stay responsive, 320px layout, reduced motion, navigation cleanup, wrapped filter/collector messages, small portrait, landscape and tablet page 1000.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
