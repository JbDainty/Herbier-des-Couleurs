import { openCarnet } from './navigation-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { mechanicIds } from '../src/engine/mechanics';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/campaign';

function floralDetails(): Save {
  let save: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    seenMechanics: [...mechanicIds],
  };
  for (const level of levels.slice(0, 3)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, 4);
  for (const m of levels[3].solution.slice(0, -1)) save = move(save, m.from, m.to);
  return save;
}
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
  // Observe real decoded Web Audio playback without replacing or muting it.
  await page.addInitScript({
    content: `
    window.__name = value => value;
    window.leafWindStarts = []; window.leafWindStops = 0;
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target, ...args) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode) this.observedGain = target;
      return connect.call(this, target, ...args);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      if (Math.abs((this.buffer?.duration || 0) - 2.8) < .01) window.leafWindStarts.push({ duration: this.buffer?.duration, gain: this.observedGain?.gain.value });
      return start.apply(this, args);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function(...args) { window.leafWindStops++; return stop.apply(this, args); };
  `,
  });
  const seed = async (motion: boolean, sound: boolean) => {
    const save = floralDetails();
    save.settings = { ...save.settings, motion, sound, music: false, haptics: false };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 04');
  };
  const finish = async () => {
    const last = levels[3].solution.at(-1)!;
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.to + 1},`) }).click();
    await expect(page.getByTestId('botanical-collection-card')).toBeVisible();
  };
  try {
    await page.goto(url);
    await openCarnet(page);
    await seed(true, true);
    await expect(page.getByTestId('chapter-landscape-caption')).toHaveText(
      'Les prairies fleuries, chapitre 1',
    );
    const prompt = page.getByTestId('current-botanical-stamp');
    expect((await prompt.boundingBox())!.width).toBeLessThan(150);
    await prompt.click();
    await expect(page.getByTestId('current-plate-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Revenir au jeu' }).click();
    await finish();
    await expect(page.getByTestId('victory-paper-entering')).toBeAttached();
    const card = page.getByTestId('botanical-collection-card');
    const first = await card.evaluate((node) => getComputedStyle(node).transform);
    await expect
      .poll(() => card.evaluate((node) => getComputedStyle(node).transform))
      .not.toBe(first);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { leafWindStarts: unknown[] }).leafWindStarts.length,
        ),
      )
      .toBe(1);
    const sound = await page.evaluate(
      () =>
        (window as unknown as { leafWindStarts: { duration: number; gain: number }[] })
          .leafWindStarts[0],
    );
    expect(sound.duration).toBeCloseTo(2.8, 2);
    expect(sound.gain).toBeCloseTo(0.22, 2);
    await page.screenshot({ path: 'test-results/victory-paper-entering.png', fullPage: true });
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    expect(
      await page.evaluate(
        () => (window as unknown as { leafWindStarts: unknown[] }).leafWindStarts.length,
      ),
    ).toBe(1);
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(page.getByTestId('victory-living-paper')).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { leafWindStops: number }).leafWindStops),
    ).toBeGreaterThan(0);
    await seed(true, false);
    await finish();
    await expect(page.getByTestId('victory-paper-settled')).toBeAttached();
    expect(
      await card.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m22),
    ).toBeCloseTo(1);
    expect(
      await page.evaluate(
        () => (window as unknown as { leafWindStarts: unknown[] }).leafWindStarts.length,
      ),
    ).toBe(0);
    await page.screenshot({ path: 'test-results/victory-living-paper.png', fullPage: true });
    await seed(false, false);
    await finish();
    await expect(page.getByTestId('victory-paper-settled')).toBeAttached();
    await expect(page.getByTestId('victory-paper-entering')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => (window as unknown as { leafWindStarts: unknown[] }).leafWindStarts.length,
      ),
    ).toBe(0);
    expect(errors).toEqual([]);
    console.log(
      'Victory: botanical collection card settles gently, real 2.8s low-volume leaf audio plays once and stops on exit, mute and reduced motion respected, botanical stamp opens the plate, inline chapter caption passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
