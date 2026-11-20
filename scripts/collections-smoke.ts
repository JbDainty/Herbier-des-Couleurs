import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/campaign';
import { mechanicIds } from '../src/engine/mechanics';
import { gardenPuzzle } from '../src/state/gardens';

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
  page.on('pageerror', (error) => errors.push(error.message));
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const button = (name: string | RegExp) =>
    page.getByRole('button', { name, exact: typeof name === 'string' });
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  let save: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    nickname: 'Collection',
    seenMechanics: [...mechanicIds],
  };
  for (const level of levels.slice(0, 20)) {
    save = loadLevel(save, level.id);
    for (const step of level.solution) save = move(save, step.from, step.to);
  }
  save = {
    ...loadLevel(save, 21),
    seeds: 240,
    settings: { ...save.settings, motion: false, sound: false, music: false, haptics: false },
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await page.getByRole('link', { name: 'Boutique', exact: true }).click();
    await expect(page.getByTestId('seed-shop')).toBeVisible();
    await button('Acquérir ce décor · 20 graines').click();
    await button('Garder mes graines').click();
    expect((await stored()).seeds).toBe(240);
    await button('Acquérir ce décor · 20 graines').click();
    await button('Confirmer pour 20 graines').dblclick();
    expect((await stored()).seeds).toBe(220);
    expect((await stored()).ownedWallpapers).toEqual(['ecosystem-0']);
    await page.reload();
    await expect(button('Décor utilisé')).toBeDisabled();
    expect((await stored()).seeds).toBe(220);
    await button('Menu principal').click();
    await expect(page.getByTestId('selected-wallpaper')).toBeAttached();
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('workshop-wallpaper')).toBeAttached();
    await button('Indice').click();
    await expect(page.getByTestId('hint-writing-text')).not.toBeEmpty();
    expect((await stored()).seeds).toBe(220);
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    const campaign = await stored();
    await button('Menu principal').click();
    await page.getByRole('link', { name: 'Boutique', exact: true }).click();
    await page.getByTestId('featured-garden').screenshot({ path: 'test-results/orchid-shop.png' });
    await button('Débloquer le jardin · 150 graines').click();
    await button('Confirmer pour 150 graines').dblclick();
    await expect(page.getByTestId('garden-species-aurore')).toBeVisible();
    expect((await stored()).seeds).toBe(70);
    expect((await stored()).gardens!['orchidees-lumiere'].species).toEqual(['aurore']);
    await page
      .getByTestId('garden-species-aurore')
      .getByRole('button', { name: 'Restaurer cette orchidée', exact: true })
      .click();
    for (let index = 0; index < 5; index++) {
      const puzzle = gardenPuzzle('orchidees-lumiere', 'aurore', index);
      for (const [stepIndex, step] of puzzle.solution.entries()) {
        await tube(step.from).click();
        await tube(step.to).click();
        if (index === 0 && stepIndex === 0) {
          const beforeReload = (await stored()).gardenSession;
          await page.reload();
          await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
          expect((await stored()).gardenSession).toEqual(beforeReload);
        }
      }
      await expect(page.getByTestId('garden-victory')).toBeVisible();
      await expect(page.getByTestId('garden-victory')).toContainText(
        'ne rapportent pas de graines',
      );
      expect((await stored()).seeds).toBe(70);
      expect((await stored()).gardenSession!.seedReward).toBe(0);
      if (index < 4) await button('Restaurer la page suivante').click();
    }
    await page
      .getByTestId('garden-victory')
      .screenshot({ path: 'test-results/orchid-restored.png' });
    await button('Contempler mon jardin').click();
    expect((await stored()).seeds).toBe(70);
    await page
      .getByTestId('garden-species-aurore')
      .getByRole('button', { name: 'Rejouer cette orchidée', exact: true })
      .click();
    for (const step of gardenPuzzle('orchidees-lumiere', 'aurore', 0).solution) {
      await tube(step.from).click();
      await tube(step.to).click();
    }
    await expect(page.getByTestId('garden-victory')).toContainText('ne rapportent pas de graines');
    expect((await stored()).seeds).toBe(70);
    await button('Retrouver toutes mes orchidées').click();
    const card = page.getByTestId('garden-species-velours');
    await card
      .getByRole('button', { name: 'Accueillir cette orchidée · 45 graines', exact: true })
      .click();
    await button('Confirmer pour 45 graines').dblclick();
    expect((await stored()).seeds).toBe(25);
    await page.reload();
    await button('Retrouver toutes mes orchidées').click();
    await expect(
      card.getByRole('button', { name: 'Restaurer cette orchidée', exact: true }),
    ).toBeVisible();
    expect((await stored()).gardens!['orchidees-lumiere'].species).toEqual(['aurore', 'velours']);
    const after = await stored();
    for (const key of [
      'current',
      'board',
      'history',
      'moves',
      'completed',
      'pigments',
      'known',
      'paidHints',
    ] as const)
      expect(after[key]).toEqual(campaign[key]);
    // Animated pours use the same persisted transition, with undo and safe departure.
    await page.evaluate(() => {
      const current = JSON.parse(localStorage.getItem('color-world.save')!);
      current.settings.motion = true;
      localStorage.setItem('color-world.save', JSON.stringify(current));
    });
    await page.reload();
    await button('Retrouver toutes mes orchidées').click();
    await card.getByRole('button', { name: 'Restaurer cette orchidée', exact: true }).click();
    const freshBoard = (await stored()).gardenSession!.board;
    await button('Indice gratuit').click();
    await expect(
      page.getByTestId('collection-garden').getByText(/^Versez le flacon/),
    ).toBeVisible();
    const first = gardenPuzzle('orchidees-lumiere', 'velours', 0).solution[0];
    await tube(first.from).click();
    await tube(first.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(button('Recommencer')).toBeDisabled();
    await expect.poll(async () => (await stored()).gardenSession!.moves).toBe(1);
    await button('Annuler').click();
    expect((await stored()).gardenSession!.board).toEqual(freshBoard);
    await tube(first.from).click();
    await tube(first.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await button('Menu principal').click();
    await page.waitForTimeout(1200);
    expect((await stored()).gardenSession!.moves).toBe(0);
    await page.goto(url + 'jardin');
    await button('Retrouver toutes mes orchidées').click();
    for (const [width, height] of [
      [320, 568],
      [393, 852],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page
      .getByTestId('garden-species-aurore')
      .screenshot({ path: 'test-results/orchid-collection.png' });
    // Old saves preserve their balance and receive only the retired-paper refund once.
    const legacy = { ...save, seeds: 7, theme: 'rose', owned: ['ivoire', 'rose'] };
    delete legacy.economyVersion;
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), legacy);
    await page.goto(url);
    await expect(page.getByTestId('seed-count').filter({ visible: true })).toHaveText('157');
    await page.getByRole('link', { name: 'Boutique', exact: true }).click();
    await button('Acquérir ce décor · 20 graines').click();
    await button('Confirmer pour 20 graines').click();
    expect((await stored()).seeds).toBe(137);
    await page.reload();
    await expect(page.getByTestId('seed-count').filter({ visible: true })).toHaveText('137');
    expect(errors).toEqual([]);
    console.log(
      'Collection flow passed: wallpaper preview/cancel/purchase/activation/reload, free hints, garden and species purchases without double debit, all five orchid pages, interrupted-puzzle resume, main campaign preserved, three viewports and one-time legacy credit.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
