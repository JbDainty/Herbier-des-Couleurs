import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { passStudio } from './studio-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8130/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const date = '2026-11-20T12:00:00Z';
  const save: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    nickname: 'Camille',
    seeds: 29,
    completed: { 1: { stars: 3, date } },
    pigments: [discoverPigment(1, date)],
  };
  save.settings = { ...save.settings, sound: false, music: false, motion: false };
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const tab = (name: string) => page.getByRole('tab', { name, exact: true });
  const panel = page.getByTestId('settings-panel-scroll');
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url + 'parametres');
    await passStudio(page);
    await expect(tab('Jeu')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('switch')).toHaveCount(5);
    expect(await stored()).toEqual(save);
    // Every preference changes only its own field and survives a reload.
    for (const [name, key] of [
      ['Sons de l’atelier', 'sound'],
      ['Musique du livre', 'music'],
      ['Vibrations légères', 'haptics'],
      ['Symboles dans les liquides', 'patterns'],
      ['Animations douces', 'motion'],
    ] as const) {
      const before = await stored();
      const target = page.getByRole('switch', { name, exact: true });
      await target.click();
      await expect(target).toHaveAttribute('aria-checked', String(!before.settings[key]));
      await expect
        .poll(stored)
        .toEqual({ ...before, settings: { ...before.settings, [key]: !before.settings[key] } });
      await page.reload();
      await passStudio(page);
      await expect(page.getByRole('switch', { name, exact: true })).toHaveAttribute(
        'aria-checked',
        String(!before.settings[key]),
      );
      await page.getByRole('switch', { name, exact: true }).click();
      await expect.poll(stored).toEqual(before);
    }
    await tab('Carnet').click();
    const input = page.getByRole('textbox', { name: 'Votre pseudo', exact: true });
    await input.fill('A');
    await page.getByRole('button', { name: 'Modifier ma signature', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('2 à 24 caractères');
    expect(await stored()).toEqual(save);
    await input.fill('  Élise   des bois  ');
    await tab('Jeu').click();
    await tab('Carnet').click();
    await expect(input).toHaveValue('  Élise   des bois  ');
    await page.getByRole('button', { name: 'Modifier ma signature', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Le carnet de Élise des bois', exact: true }),
    ).toBeVisible();
    await expect.poll(stored).toEqual({ ...save, nickname: 'Élise des bois' });
    const signed = await stored();
    for (const provider of ['Google', 'Apple']) {
      await page.getByRole('button', { name: `Connexion ${provider}, bientôt disponible` }).click();
      await expect(page.getByTestId('account-connection-status')).toContainText(
        `La connexion ${provider} n’est pas encore activée.`,
      );
      expect(await stored()).toEqual(signed);
    }
    // Both cancellation points remain harmless after moving reset into Carnet.
    const reset = page.getByRole('button', { name: 'Remettre ma progression à zéro' });
    await reset.click();
    await page.getByRole('button', { name: 'Conserver ma progression', exact: true }).click();
    await reset.click();
    await page.getByRole('button', { name: 'Continuer vers la confirmation', exact: true }).click();
    await page.getByRole('button', { name: 'Conserver ma progression', exact: true }).click();
    expect(await stored()).toEqual(signed);
    await tab('À propos').click();
    for (const [name, detail] of [
      ['Confidentialité', 'Aucune mesure d’audience'],
      ['Illustrations & sons', 'jackthemurray'],
      ['Notes botaniques', 'GBIF Backbone Taxonomy'],
    ]) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByTestId('settings-about-panel')).toContainText(detail);
      await button.click();
    }
    // A bounded folio keeps tabs visible, with internal scrolling for short screens.
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
      for (const name of ['Jeu', 'Carnet', 'À propos']) {
        await tab(name).click();
        await expect(tab(name)).toHaveAttribute('aria-selected', 'true');
        await expect.poll(() => panel.evaluate((n) => n.scrollTop)).toBe(0);
        for (const t of ['Jeu', 'Carnet', 'À propos'])
          await expect(tab(t)).toBeInViewport({ ratio: 1 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight),
        ).toBeLessThanOrEqual(height + 1);
        expect(await panel.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeLessThanOrEqual(1);
        if (name === 'Jeu') {
          for (const target of await page.getByRole('switch').all()) {
            await target.scrollIntoViewIfNeeded();
            await expect(target).toBeInViewport({ ratio: 1 });
            expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          }
          if (height >= 800)
            expect(
              await panel.evaluate((n) => n.scrollHeight - n.clientHeight),
            ).toBeLessThanOrEqual(1);
        }
        if (width === 393) {
          await panel.evaluate((n) => n.scrollTo(0, 0));
          await page.screenshot({
            path: `test-results/settings-${name === 'Jeu' ? 'jeu' : name === 'Carnet' ? 'carnet' : 'apropos'}-phone.png`,
          });
        }
      }
    }
    // Leaving a deeply scrolled notebook opens the game tab at its beginning.
    await tab('Carnet').click();
    await page.getByTestId('test-page-tools').scrollIntoViewIfNeeded();
    await tab('Jeu').click();
    await expect.poll(() => panel.evaluate((n) => n.scrollTop)).toBe(0);
    expect(await stored()).toEqual(signed);
    expect(errors).toEqual([]);
    console.log(
      'Settings passed: 3 tabs, all 5 preferences persist independently, signature validation/draft/normalization, honest accounts, reset cancellation at both steps, readable credits, 7 phone/tablet/landscape sizes, fixed tabs, internal scroll and unchanged progression.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
