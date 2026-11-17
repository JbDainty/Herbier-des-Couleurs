import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/campaign';
import { mechanicIds, mechanicDetails } from '../src/engine/mechanics';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import { acquireGarden, acquireGardenSpecies } from '../src/state/economy';
import { startGarden, sessionGardenPuzzle } from '../src/state/gardens';

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
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const card = page.getByTestId('mechanic-introduction');
  const seed = async (s: Save, route: string) => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + route);
  };
  let base: Save = { ...initial(), started: true, guideSeen: true, seeds: 500, nickname: 'Leçons' };
  base.settings = { ...base.settings, motion: false, sound: false, music: false, haptics: false };
  mkdirSync('test-results', { recursive: true });
  try {
    // The eight actual campaign mechanisms each get a short single-card explanation.
    for (const id of mechanicIds) {
      const before = { ...base, seenMechanics: mechanicIds.filter((m) => m !== id) };
      const level = levels.find((p) => p.rules?.mechanics.includes(id))!;
      const trial = loadLevel({ ...before, testSession: { returnSave: before } }, level.id);
      await seed(trial, 'atelier');
      await expect(card).toBeVisible();
      await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(mechanicDetails[id].name);
      await expect(page.getByTestId('mechanic-lesson-summary')).toHaveText(
        mechanicDetails[id].summary,
      );
      await expect(page.getByTestId('mechanic-lesson-summary')).toHaveCount(1);
      await expect(page.getByTestId('mechanic-lesson-detail')).toHaveCount(0);
      await button('En savoir plus').click();
      await expect(page.getByTestId('mechanic-lesson-detail')).toHaveText(
        mechanicDetails[id].intro,
      );
      await button('Réduire l’explication').click();
      for (const [width, height] of [
        [320, 400],
        [393, 852],
        [932, 430],
        [768, 1024],
      ]) {
        await page.setViewportSize({ width, height });
        const summary = (await card.boundingBox())!;
        expect(summary.width).toBeLessThanOrEqual(380);
        expect(summary.x).toBeGreaterThanOrEqual(0);
        expect(summary.x + summary.width).toBeLessThanOrEqual(width + 1);
        const action = (await button('J’ai compris').boundingBox())!;
        expect(action.height).toBeGreaterThanOrEqual(44);
        expect(action.y).toBeGreaterThanOrEqual(0);
        expect(action.y + action.height).toBeLessThanOrEqual(height);
      }
      await page.setViewportSize({ width: 393, height: 852 });
      if (id === 'locks') await card.screenshot({ path: 'test-results/mechanic-summary.png' });
      expect((await stored()).seeds).toBe(trial.seeds);
      expect((await stored()).board).toEqual(trial.board);
      await button('J’ai compris').click();
      await expect(card).toHaveCount(0);
      expect((await stored()).seenMechanics).toContain(id);
      await page.reload();
      await expect(page.getByTestId('page-folio')).toBeVisible();
      await expect(card).toHaveCount(0);
    }
    // Enter an orchid before the campaign lesson: one acknowledgement cannot skip all three.
    for (const p of levels.slice(0, 10)) {
      base = loadLevel(base, p.id);
      for (const m of p.solution) base = move(base, m.from, m.to);
    }
    base = loadLevel(base, 11);
    base = acquireGarden(base, 'orchidees-lumiere', new Date('2026-11-17'));
    let orchid = startGarden(base, 'orchidees-lumiere', 'aurore');
    const types = sessionGardenPuzzle(orchid.gardenSession!).rules!.mechanics;
    await seed(orchid, 'jardin');
    await expect(page.getByTestId('mechanic-lesson-position')).toHaveText('1 / 3');
    await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(
      mechanicDetails[types[0]].name,
    );
    await button('J’ai compris').click();
    expect((await stored()).seenMechanics).toEqual([types[0]]);
    await expect(page.getByTestId('mechanic-lesson-position')).toHaveText('2 / 3');
    await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(
      mechanicDetails[types[1]].name,
    );
    await page.reload();
    await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(
      mechanicDetails[types[1]].name,
    );
    expect((await stored()).seenMechanics).toEqual([types[0]]);
    await button('J’ai compris').click();
    await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(
      mechanicDetails[types[2]].name,
    );
    await button('J’ai compris').click();
    await expect(card).toHaveCount(0);
    const learned = await stored();
    expect(learned.seeds).toBe(orchid.seeds);
    expect(learned.gardenSession!.board).toEqual(orchid.gardenSession!.board);
    await page.goto(url + 'atelier');
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 11');
    await expect(card).toHaveCount(0); // mystery was learned in the orchid garden.
    // A golden mixed page contains known filters plus unknown links/pipettes: only the new ones.
    let golden = acquireGardenSpecies(await stored(), 'merveilles-or', 'temps');
    expect(golden.gardens?.['merveilles-or'].species).toContain('temps');
    golden = startGarden(golden, 'merveilles-or', 'temps');
    expect(golden.gardenSession!.collection).toBe('merveilles-or');
    const unknown = sessionGardenPuzzle(golden.gardenSession!).rules!.mechanics.filter(
      (id) => !golden.seenMechanics!.includes(id),
    );
    await seed(golden, 'jardin?collection=merveilles-or');
    for (const id of unknown) {
      await expect(page.getByTestId('mechanic-lesson-title')).toHaveText(mechanicDetails[id].name);
      await button('J’ai compris').click();
    }
    await expect(card).toHaveCount(0);
    await button('Les mécanismes de cette page').click();
    await expect(card).toBeVisible();
    await button('Fermer les règles').click();
    await expect(card).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('garden-puzzle')).toBeVisible();
    await expect(card).toHaveCount(0);
    expect((await stored()).seeds).toBe(golden.seeds);
    expect(errors).toEqual([]);
    console.log(
      'Mechanic lessons passed: eight actual mechanisms, concise cards and optional detail, four sizes, one-at-a-time mixed lessons, reload during a queue, campaign/orchid/golden shared history, no duplicate lessons, manual recall, no puzzle or wallet changes.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
