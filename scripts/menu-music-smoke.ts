import { chromium, expect } from '@playwright/test';
import { initial } from '../src/state/model';
import { GOLDEN_COLLECTION_ID } from '../src/data/collections';
import { mechanicIds } from '../src/engine/mechanics';
import { acquireGardenSpecies } from '../src/state/economy';
import { openCarnet, openHome, openScreen } from './navigation-test-helper';

type Voice = { duration: number; offset: number; stopped: boolean };

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
      hasTouch: true,
      serviceWorkers: 'block',
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const save = acquireGardenSpecies(
      {
        ...initial(),
        started: true,
        guideSeen: true,
        nickname: 'Camille',
        seeds: 200,
        seenMechanics: [...mechanicIds],
      },
      GOLDEN_COLLECTION_ID,
      'phenix',
    );
    save.settings = { ...save.settings, sound: false, music: true };
    await page.addInitScript((save) => {
      if (!localStorage.getItem('color-world.save'))
        localStorage.setItem('color-world.save', JSON.stringify(save));
      const state = window as typeof window & { musicVoices: Voice[]; overlap: boolean };
      state.musicVoices = [];
      state.overlap = false;
      const voices = new WeakMap<AudioBufferSourceNode, Voice>();
      const { start, stop } = AudioBufferSourceNode.prototype;
      AudioBufferSourceNode.prototype.start = function (...args) {
        start.apply(this, args);
        if (!this.loop || !this.buffer) return;
        if (state.musicVoices.some((voice) => !voice.stopped)) state.overlap = true;
        const voice = { duration: this.buffer.duration, offset: args[1] ?? 0, stopped: false };
        voices.set(this, voice);
        state.musicVoices.push(voice);
      };
      AudioBufferSourceNode.prototype.stop = function (when) {
        const voice = voices.get(this);
        if (voice) voice.stopped = true;
        stop.call(this, when);
      };
    }, save);
    const active = () =>
      page.evaluate(() => {
        const state = window as typeof window & { musicVoices: Voice[] };
        return state.musicVoices.filter((voice) => !voice.stopped);
      });
    const count = async () => (await active()).length;
    const album = async () => (await active()).map((voice) => Math.round(voice.duration));
    const starts = () =>
      page.evaluate(() => (window as typeof window & { musicVoices: Voice[] }).musicVoices.length);
    const hidden = (value: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, value });
        document.dispatchEvent(new Event('visibilitychange'));
      }, value);

    await page.goto(process.env.GAME_TEST_URL || 'http://127.0.0.1:8135/');
    const skipStudio = page.getByRole('button', { name: 'Passer le logo du studio' });
    await expect(skipStudio).toBeVisible();
    expect(await active()).toEqual([]);
    await skipStudio.click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect.poll(album).toEqual([56]);

    await hidden(true);
    await expect.poll(count).toBe(0);
    await hidden(false);
    await expect.poll(album).toEqual([56]);
    expect((await active())[0].offset).toBeGreaterThan(0);

    const continuous = await starts();
    await openScreen(page, 'Boutique');
    await expect.poll(album).toEqual([56]);
    await page.getByRole('button', { name: 'Voir les décors', exact: true }).click();
    await expect(page.getByTestId('wallpaper-preview')).toBeVisible();
    await expect.poll(album).toEqual([56]);
    await page.getByRole('button', { name: 'Retour à la boutique', exact: true }).click();
    await page.getByRole('button', { name: 'Découvrir les cinq merveilles', exact: true }).click();
    await expect(page.getByTestId('golden-gallery')).toBeVisible();
    await expect.poll(album).toEqual([56]);
    await openScreen(page, 'Paramètres');
    await expect.poll(album).toEqual([56]);
    expect(await starts()).toBe(continuous);

    await openScreen(page, 'Boutique');
    await page.getByRole('button', { name: 'Découvrir les cinq merveilles', exact: true }).click();
    await page.getByRole('button', { name: 'Restaurer cette merveille', exact: true }).click();
    await expect(page.getByTestId('garden-puzzle')).toBeVisible();
    await expect.poll(album).toEqual([64]);
    await openHome(page);

    await openCarnet(page);
    await expect.poll(album).toEqual([64]);
    await openHome(page);
    await expect.poll(album).toEqual([56]);
    await page.getByTestId('home-future-day').click();
    await expect(page).toHaveURL(/\/vitrail(?:\?|$)/);
    await expect.poll(album).toEqual([64]);
    await page.getByRole('button', { name: 'J’ai compris', exact: true }).click();

    await openScreen(page, 'Paramètres');
    const music = page.getByRole('switch', { name: 'Musique du livre', exact: true });
    await expect.poll(album).toEqual([56]);
    await music.click();
    await expect.poll(count).toBe(0);
    await openScreen(page, 'Boutique');
    expect(await active()).toEqual([]);
    await openScreen(page, 'Paramètres');
    await music.click();
    await expect.poll(album).toEqual([56]);
    const reenabled = await starts();
    await openHome(page);
    expect(await starts()).toBe(reenabled);

    await page.getByRole('button', { name: 'Revoir le prologue' }).click();
    await expect(page.getByTestId('book-opening-film')).toBeVisible();
    await expect.poll(count).toBe(0);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect.poll(album).toEqual([56]);
    expect(
      await page.evaluate(() => (window as typeof window & { overlap: boolean }).overlap),
    ).toBe(false);
    expect(errors).toEqual([]);
    console.log(
      'Menu music passed: uninterrupted 56-second loop across the menu, shop, golden gallery and settings, separate puzzle ambience, background resume, music switch, and prologue without overlapping loops.',
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
