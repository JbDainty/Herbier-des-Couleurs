import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { acquireGarden, acquireGardenSpecies } from '../src/state/economy';
import { gardenPuzzle, loadGardenPage, moveGarden } from '../src/state/gardens';
import { goalPacking } from '../src/engine/goalPacking';
import { mechanicIds } from '../src/engine/mechanics';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  const transfer = async (from: number, to: number) => {
    await tube(from).click();
    await tube(to).click();
  };
  let base: Save = { ...initial(), started: true, guideSeen: true, seeds: 1000 };
  base = acquireGarden(base, 'orchidees-lumiere', new Date('2026-11-17'));
  base = acquireGardenSpecies(base, 'merveilles-or', 'temps');
  base.settings = { ...base.settings, motion: false, sound: false, music: false, haptics: false };
  const seed = async (s: Save, route = 'jardin') => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + route);
  };
  const explain = async () => {
    if (await page.getByTestId('mechanic-introduction').isVisible())
      await button('J’ai compris').click();
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await seed(loadGardenPage(base, 'orchidees-lumiere', 'aurore', 0));
    await expect(page.getByTestId('mechanic-introduction')).toBeVisible();
    await explain();
    const puzzle = gardenPuzzle('orchidees-lumiere', 'aurore', 0);
    await expect(page.getByTestId('garden-mechanics')).toContainText('Défi expert');
    expect((await stored()).gardenSession!.known!.flat().some((v) => !v)).toBe(true);
    for (const m of puzzle.solution.slice(0, 3)) await transfer(m.from, m.to);
    const checkpoint = (await stored()).gardenSession!.board;
    await transfer(7, 5);
    const trapped = await stored();
    expect(trapped.gardenSession!.moves).toBe(4);
    expect(goalPacking(puzzle.board, puzzle.rules)(trapped.gardenSession!.board).possible).toBe(
      false,
    );
    await button('Indice gratuit').click();
    await expect(page.getByText(/Cette position est une impasse/)).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('garden-puzzle')).toBeVisible();
    expect((await stored()).gardenSession!.board).toEqual(trapped.gardenSession!.board);
    await button('Chemin sûr').click();
    expect((await stored()).gardenSession!.board).toEqual(checkpoint);
    expect((await stored()).gardenSession!.moves).toBe(3);
    expect((await stored()).seeds).toBe(base.seeds);
    while (!(await stored()).gardenSession!.rewarded) {
      const before = (await stored()).gardenSession!.guide!.path.length;
      await button('Indice gratuit').click();
      const m = (await stored()).gardenSession!.guide!.path[0];
      await transfer(m.from, m.to);
      expect((await stored()).gardenSession!.guide!.path.length).toBe(before - 1);
    }
    await expect(page.getByTestId('garden-victory')).toBeVisible();
    expect((await stored()).seeds).toBe(base.seeds);
    expect((await stored()).board).toEqual(base.board);
    // The final page exercises locks and real small capacities on four screen layouts.
    let late = await stored();
    for (let i = 1; i < 4; i++)
      late.gardens!['orchidees-lumiere'].completed[`aurore:${i}`] = {
        stars: 2,
        date: new Date().toISOString(),
      };
    late = loadGardenPage(
      { ...late, seenMechanics: [...mechanicIds] },
      'orchidees-lumiere',
      'aurore',
      4,
    );
    await seed(late);
    for (const [width, height] of [
      [320, 568],
      [393, 852],
      [932, 430],
      [1440, 1000],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      for (const target of await page.getByRole('button', { name: /^Flacon / }).all()) {
        const b = (await target.boundingBox())!;
        expect(b.width).toBeGreaterThanOrEqual(43.9);
        expect(b.height).toBeGreaterThanOrEqual(43.9);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      }
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page
      .getByTestId('garden-puzzle')
      .screenshot({ path: 'test-results/collection-expert.png' });
    const golden = loadGardenPage(
      { ...base, seenMechanics: [...mechanicIds] },
      'merveilles-or',
      'temps',
      0,
    );
    await seed(golden, 'jardin?collection=merveilles-or');
    for (const m of gardenPuzzle('merveilles-or', 'temps', 0).alternatives![0])
      await transfer(m.from, m.to);
    await expect(page.getByTestId('garden-victory')).toBeVisible();
    expect((await stored()).gardenSession!.seedReward).toBe(0);
    expect((await stored()).seeds).toBe(base.seeds);
    // An APK save created before this update keeps its exact classic attempt.
    let legacy = loadGardenPage(base, 'orchidees-lumiere', 'aurore', 0, 1);
    const oldPuzzle = gardenPuzzle('orchidees-lumiere', 'aurore', 0, 1);
    legacy = moveGarden(legacy, oldPuzzle.solution[0].from, oldPuzzle.solution[0].to);
    delete legacy.gardenSession!.puzzleVersion;
    delete legacy.gardenSession!.known;
    delete legacy.gardenSession!.historyKnown;
    delete legacy.gardenSession!.guide;
    await seed(legacy);
    await expect(page.getByTestId('garden-mechanics')).toHaveCount(0);
    expect((await stored()).gardenSession!.board).toEqual(legacy.gardenSession!.board);
    await button('Recommencer en défi expert').click();
    await expect(page.getByTestId('mechanic-introduction')).toBeVisible();
    expect((await stored()).gardenSession!.puzzleVersion).toBe(2);
    expect((await stored()).gardenSession!.moves).toBe(0);
    expect((await stored()).seeds).toBe(base.seeds);
    await seed(legacy);
    for (const m of oldPuzzle.solution.slice(1)) await transfer(m.from, m.to);
    await expect(page.getByTestId('garden-victory')).toBeVisible();
    await button('Restaurer la page suivante').click();
    await expect(page.getByTestId('mechanic-introduction')).toBeVisible();
    expect((await stored()).gardenSession!.puzzleVersion).toBe(2);
    expect(errors).toEqual([]);
    console.log(
      'Expert collections passed: three mechanisms, mystery state, real irreversible trap, reload and free one-move recovery, strictly decreasing hints to victory, golden alternative solution, small/locked vials on four layouts, no currency/campaign changes and classic-save handoff.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
