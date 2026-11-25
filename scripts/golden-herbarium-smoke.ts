import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { GOLDEN_COLLECTION_ID, collectionById } from '../src/data/collections';
import { mechanicIds } from '../src/engine/mechanics';
import { gardenPuzzle } from '../src/state/gardens';
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
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const chooseSpecies = async (id: string) => {
    const tab = page.getByTestId(`golden-gallery-tab-${id}`);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId(`garden-species-${id}`)).toBeVisible();
  };
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const seed: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    seenMechanics: [...mechanicIds],
    nickname: 'Merveilles',
    seeds: 1200,
    settings: { ...initial().settings, sound: false, music: false, haptics: false },
  };
  const golden = collectionById(GOLDEN_COLLECTION_ID)!;
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), seed);
    await page.goto(url);
    await passStudio(page);
    await page.getByRole('link', { name: 'Herbier', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(4);
    const grid = (await page.getByTestId('herbarium-volume-grid').boundingBox())!;
    const ordinary = (await page.getByTestId('herbarium-book-0').boundingBox())!;
    await button('Voir l’Herbier des Merveilles').click();
    const book = page.getByTestId('golden-herbarium-book');
    await expect(book).toBeVisible();
    const large = (await book.boundingBox())!;
    expect(Math.abs(large.width - grid.width)).toBeLessThan(1);
    expect(Math.abs(large.height - grid.height)).toBeLessThan(1);
    expect(large.width).toBeGreaterThan(ordinary.width * 2);
    expect(large.height).toBeGreaterThan(ordinary.height * 2);
    await expect(page.getByTestId('herbarium-shelf-page')).toHaveText('6 / 6');
    await expect(page.getByTestId('golden-book-shimmer')).toBeAttached();
    const pollen = page.getByTestId('golden-book-pollen');
    const before = await pollen.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(350);
    expect(await pollen.evaluate((node) => getComputedStyle(node).transform)).not.toBe(before);
    await book.screenshot({ path: 'test-results/golden-herbarium-book.png' });
    await book.click();
    await expect(page.getByTestId('collection-garden')).toBeVisible();
    expect((await stored()).seeds).toBe(1200);
    expect((await stored()).gardens![golden.id]).toBeUndefined();
    await expect(
      page.getByRole('tablist', { name: 'Les cinq espèces' }).getByRole('tab'),
    ).toHaveCount(5);
    await expect(page.locator('[data-testid^="golden-silhouette-"]')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Les Merveilles', exact: true })).toBeVisible();
    for (const plant of golden.species) {
      await chooseSpecies(plant.id);
      await expect(page.getByTestId('golden-gallery-description')).toHaveText(plant.description);
    }
    await chooseSpecies('temps');
    const temps = page.getByTestId('garden-species-temps');
    await temps.getByRole('button', { name: 'Acquérir · 200 graines', exact: true }).click();
    await button('Garder mes graines').click();
    expect((await stored()).seeds).toBe(1200);
    await temps.getByRole('button', { name: 'Acquérir · 200 graines', exact: true }).click();
    await button('Confirmer pour 200 graines').dblclick();
    expect((await stored()).seeds).toBe(1000);
    expect((await stored()).gardens![golden.id].species).toEqual(['temps']);
    await expect(page.getByTestId('golden-silhouette-temps')).toHaveCount(0);
    await temps.screenshot({ path: 'test-results/golden-passiflore.png' });
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('color-world.save')!);
      s.settings.motion = false;
      localStorage.setItem('color-world.save', JSON.stringify(s));
    });
    await page.reload();
    await passStudio(page);
    await temps.getByRole('button', { name: 'Restaurer cette merveille', exact: true }).click();
    const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
    for (let index = 0; index < 5; index++) {
      for (const [i, step] of gardenPuzzle(golden.id, 'temps', index).solution.entries()) {
        await tube(step.from).click();
        await tube(step.to).click();
        if (index === 0 && i === 0) {
          const pending = (await stored()).gardenSession;
          await page.reload();
          await passStudio(page);
          await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
          expect((await stored()).gardenSession).toEqual(pending);
        }
      }
      await expect(page.getByTestId('garden-victory')).toBeVisible();
      expect((await stored()).seeds).toBe(1000);
      expect((await stored()).gardenSession!.seedReward).toBe(0);
      if (index < 4) await button('Restaurer la page suivante').click();
    }
    await button('Contempler mon herbier doré').click();
    for (const species of golden.species.slice(0, 4)) {
      await chooseSpecies(species.id);
      await page
        .getByTestId(`garden-species-${species.id}`)
        .getByRole('button', { name: 'Acquérir · 200 graines', exact: true })
        .click();
      await button('Confirmer pour 200 graines').click();
    }
    expect((await stored()).seeds).toBe(200);
    expect((await stored()).gardens![golden.id].species).toHaveLength(5);
    const result = await stored();
    for (const key of ['board', 'history', 'current', 'completed', 'pigments'] as const)
      expect(result[key]).toEqual(seed[key]);
    await button('Retrouver le grand herbier doré').click();
    await expect(book).toBeVisible();
    await expect(page.getByTestId('golden-book-shimmer')).toHaveCount(0);
    await expect(page.getByText('5 / 5 merveilles acquises', { exact: true })).toBeVisible();
    for (const [width, height] of [
      [320, 568],
      [393, 852],
      [932, 430],
      [1440, 1000],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(book).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      await expect
        .poll(async () => {
          const bounds = await book.boundingBox();
          return (
            !!bounds &&
            bounds.x >= 0 &&
            bounds.x + bounds.width <= width + 1 &&
            bounds.y + bounds.height <= height + 1
          );
        })
        .toBe(true);
    }
    await page.reload();
    await passStudio(page);
    await expect(book).toBeVisible();
    expect((await stored()).seeds).toBe(200);
    expect((await stored()).gardens![golden.id].species).toHaveLength(5);
    expect(errors).toEqual([]);
    console.log(
      'Golden herbarium passed: four-slot cover, animated/reduced-motion modes, five gallery tabs, four hidden paintings, any-order purchases at 200 without double debit, five puzzles and interrupted resume without seed gains, campaign preserved, ownership reload and four sizes.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
