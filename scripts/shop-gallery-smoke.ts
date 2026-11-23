import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/campaign';
import { openCarnet, openHome, openScreen } from './navigation-test-helper';
import { passStudio } from './studio-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
    hasTouch: true,
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8133/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const button = (name: string | RegExp) =>
    page.getByRole('button', { name, exact: typeof name === 'string' });
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  let save: Save = { ...initial(), started: true, guideSeen: true, nickname: 'Camille' };
  for (const level of levels.slice(0, 20)) {
    save = loadLevel(save, level.id);
    for (const step of level.solution) save = move(save, step.from, step.to);
  }
  save = {
    ...loadLevel(save, 21),
    seeds: 1000,
    settings: { ...save.settings, motion: false, sound: false, music: false, haptics: false },
  };
  const visit = async (s: Save) => {
    await page.goto(url);
    await page.evaluate(
      (value) => localStorage.setItem('color-world.save', JSON.stringify(value)),
      s,
    );
    await page.goto(url + 'boutique');
    await passStudio(page);
    await expect(page.getByTestId('seed-shop')).toBeVisible();
  };
  const campaign = (s: Save) => ({
    board: s.board,
    history: s.history,
    current: s.current,
    completed: s.completed,
    pigments: s.pigments,
  });
  mkdirSync('test-results', { recursive: true });
  try {
    await visit(save);
    await expect(page.getByRole('heading', { name: 'Boutique', exact: true })).toHaveCount(1);
    await expect(page.getByTestId('seed-shop').getByTestId('herbarium-book-title')).toHaveCount(0);
    await expect(button('Collectionner · 200 graines').locator('svg')).toHaveCount(1);
    await page.getByTestId('remove-ads-offer').click();
    await expect(
      page.getByRole('heading', { name: 'Retirer les pubs', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('1,99 € · Offre à venir', { exact: true })).toBeVisible();
    await expect(page.getByText('Aucun achat n’est effectué ici.', { exact: true })).toBeVisible();
    expect(await stored()).toEqual(save);
    await button('Revenir à la boutique').click();
    await button('Comment gagner des graines ?').click();
    await expect(page.getByText(/Campagne : 1 graine/)).toBeVisible();
    await button('Revenir à la boutique').click();
    expect(await stored()).toEqual(save);
    await button('Collectionner · 200 graines').click();
    await button('Garder mes graines').click();
    expect(await stored()).toEqual(save);
    await button('Collectionner · 200 graines').click();
    await button('Confirmer pour 200 graines').dblclick();
    await expect(page.getByTestId('garden-species-phenix')).toBeVisible();
    expect((await stored()).seeds).toBe(800);
    expect((await stored()).gardens!['merveilles-or'].species).toEqual(['phenix']);
    expect(campaign(await stored())).toEqual(campaign(save));
    await openScreen(page, 'Boutique');
    await button('Retrouver ma merveille').click();
    await expect(page.getByTestId('garden-species-phenix')).toBeVisible();
    expect((await stored()).seeds).toBe(800);
    await openScreen(page, 'Boutique');
    await button('Voir les décors').click();
    await button('Acquérir ce décor · 20 graines').click();
    await button('Garder mes graines').click();
    expect((await stored()).seeds).toBe(800);
    await button('Acquérir ce décor · 20 graines').click();
    await button('Confirmer pour 20 graines').dblclick();
    await expect(button('Décor utilisé')).toBeDisabled();
    expect((await stored()).seeds).toBe(780);
    await page.reload();
    await passStudio(page);
    await expect(page.getByTestId('wallpaper-preview')).toBeVisible();
    await expect(button('Décor utilisé')).toBeDisabled();
    expect((await stored()).seeds).toBe(780);
    await expect(page.getByTestId('selected-wallpaper')).toHaveCount(0);
    await openHome(page);
    await expect(
      page.getByTestId('home-screen').getByTestId('home-garden-background').locator('img'),
    ).toHaveAttribute('src', /\/home\/clearing\./);
    await openCarnet(page);
    await expect(page.getByTestId('workshop-wallpaper').locator('img')).toHaveAttribute(
      'src',
      /\/journey\/prairies\./,
    );
    await openHome(page);
    await page.getByTestId('home-future-day').click();
    await expect(
      page.getByTestId('daily-vitrail-screen').getByTestId('home-garden-background').locator('img'),
    ).toHaveAttribute('src', /\/home\/clearing\./);
    await page.goto(url + 'boutique?rayon=decors');
    await passStudio(page);
    await page.getByTestId('wallpaper-choice-19').click();
    await expect(button(/^Acquérir ce décor ·/)).toBeDisabled();
    await expect(page.getByText(/Disponible à la découverte de cet écosystème/)).toBeVisible();
    expect((await stored()).seeds).toBe(780);
    await page.getByTestId('wallpaper-choice-1').click();
    await button('Acquérir ce décor · 20 graines').click();
    await button('Confirmer pour 20 graines').click();
    expect((await stored()).seeds).toBe(760);
    await page.getByTestId('wallpaper-choice-0').click();
    await button('Utiliser ce décor').click();
    expect((await stored()).seeds).toBe(760);
    expect((await stored()).wallpaper).toBe('ecosystem-0');
    await button('Retrouver le décor d’origine').click();
    expect((await stored()).wallpaper).toBe('default');
    await expect(page.getByTestId('workshop-wallpaper').locator('img')).toHaveAttribute(
      'src',
      /\/illustrations\/serre\./,
    );
    await button('Retour à la boutique').click();
    await button('Voir le jardin des orchidées').click();
    await button('Débloquer le jardin · 150 graines').click();
    await button('Confirmer pour 150 graines').dblclick();
    await expect(page.getByTestId('garden-species-aurore')).toBeVisible();
    expect((await stored()).seeds).toBe(610);
    expect((await stored()).gardens!['orchidees-lumiere'].species).toEqual(['aurore']);
    expect(campaign(await stored())).toEqual(campaign(save));
    await openScreen(page, 'Boutique');
    await button('Voir le jardin des orchidées').click();
    await button('Entrer dans mon jardin').click();
    expect((await stored()).seeds).toBe(610);
    const collection = await stored();
    await page.reload();
    await passStudio(page);
    expect((await stored()).gardens).toEqual(collection.gardens);
    await visit({ ...save, seeds: 35 });
    await expect(button('Collectionner · 200 graines')).toBeDisabled();
    await expect(page.getByText('Encore 165 graines.', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/shop-gallery-phone.png' });
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [393, 852],
      [430, 932],
      [768, 1024],
      [844, 390],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      for (const target of [
        button('Voir le jardin des orchidées'),
        button('Voir les décors'),
        page.getByTestId('remove-ads-offer'),
        button('Comment gagner des graines ?'),
      ]) {
        await target.scrollIntoViewIfNeeded();
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(
        await page.getByTestId('seed-shop').evaluate((n) => n.scrollWidth - n.clientWidth),
      ).toBeLessThanOrEqual(1);
      await button('Voir les décors').click();
      await expect(button('Acquérir ce décor · 20 graines')).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await button('Retour à la boutique').click();
      await button('Voir le jardin des orchidées').click();
      await expect(button('Débloquer le jardin · 150 graines')).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await button('Retour à la boutique').click();
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await visit({ ...save, seeds: 0 });
    await button('Voir les décors').click();
    await expect(button('Acquérir ce décor · 20 graines')).toBeDisabled();
    await button('Retour à la boutique').click();
    const trial = { ...save, testSession: { returnSave: save } };
    await visit(trial);
    await expect(button('Collectionner · 200 graines')).toBeDisabled();
    await button('Voir le jardin des orchidées').click();
    await expect(button('Débloquer le jardin · 150 graines')).toBeDisabled();
    expect(await stored()).toEqual(trial);
    expect(errors).toEqual([]);
    console.log(
      'Shop passed: soft gallery, coming-soon €1.99 ad removal without charge/save mutation; seed rules; rare/garden/wallpaper confirmation, cancellation, no duplicate debit, ownership/reload, locked ecosystems, free switching, campaign unchanged, insufficient seeds/trial guards and 7 responsive formats.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
