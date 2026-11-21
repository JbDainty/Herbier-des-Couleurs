import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';

async function main() {
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const save = {
    ...initial(),
    started: true,
    guideSeen: true,
    nickname: 'Krabel',
    settings: { ...initial().settings, motion: false, sound: true, music: false, haptics: false },
  };
  const errors: string[] = [];
  mkdirSync('test-results', { recursive: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
      serviceWorkers: 'block',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript({ content: 'window.__name=value=>value;' });
    await page.addInitScript(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      save,
    );
    await page.goto(url);
    const video = page.getByTestId('studio-video');
    await expect(page.getByTestId('studio-launch')).toBeVisible({ timeout: 20000 });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 })
      .toBeGreaterThan(0.4);
    expect(
      await video.evaluate((v: HTMLVideoElement) => ({
        muted: v.muted,
        volume: v.volume,
        loop: v.loop,
      })),
    ).toEqual({ muted: false, volume: 1, loop: false });
    await expect(page.getByTestId('game-shell')).toHaveCount(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    const paused = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    await page.waitForTimeout(350);
    expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeCloseTo(paused, 1);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(paused + 0.15);
    await page.screenshot({ path: 'test-results/studio-launch-portrait.png' });
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('studio-launch')).toHaveCount(0);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!)),
    ).toEqual(save);
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('page-folio')).toBeVisible();
    await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect(page.getByTestId('studio-launch')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('studio-launch')).toBeVisible();
    await page.getByTestId('studio-skip').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.close();

    const muted = await browser.newPage({
      viewport: { width: 820, height: 1180 },
      serviceWorkers: 'block',
    });
    await muted.addInitScript((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), {
      ...save,
      settings: { ...save.settings, sound: false },
    });
    await muted.goto(url);
    await expect
      .poll(() =>
        muted.getByTestId('studio-video').evaluate((v: HTMLVideoElement) => v.currentTime),
      )
      .toBeGreaterThan(0.1);
    expect(await muted.getByTestId('studio-video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(
      true,
    );
    await muted.getByTestId('studio-skip').click();
    await expect(muted.getByTestId('home-screen')).toBeVisible();
    await muted.close();

    const broken = await browser.newPage({
      viewport: { width: 393, height: 852 },
      serviceWorkers: 'block',
    });
    await broken.addInitScript(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      save,
    );
    await broken.route('**/*krabel-intro*', (r) => r.abort());
    await broken.goto(url);
    await expect(broken.getByTestId('home-screen')).toBeVisible({ timeout: 15000 });
    await expect(broken.getByTestId('studio-launch')).toHaveCount(0);
    await broken.close();
    const fresh = await browser.newPage({
      viewport: { width: 393, height: 852 },
      serviceWorkers: 'block',
    });
    fresh.on('pageerror', (e) => errors.push(e.message));
    await fresh.goto(url);
    await expect(fresh.getByTestId('studio-launch')).toBeVisible();
    await expect(fresh.getByTestId('book-opening-film')).toHaveCount(0);
    await expect(fresh.getByTestId('book-opening-film')).toBeVisible({ timeout: 15000 });
    await expect(fresh.getByTestId('studio-launch')).toHaveCount(0);
    await fresh.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await expect(fresh.getByTestId('book-signature-page')).toBeVisible();
    await fresh.close();
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }

  const guarded = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const page = await guarded.newPage({
      viewport: { width: 393, height: 852 },
      serviceWorkers: 'block',
    });
    // Force one genuine media-play rejection; Playwright probes can activate Chrome.
    await page.addInitScript({
      content: `
      const originalPlay = HTMLMediaElement.prototype.play;
      let denied = false;
      HTMLMediaElement.prototype.play = function () {
        if (!denied && this.getAttribute('data-testid') === 'studio-video') {
          denied = true;
          return Promise.reject(new DOMException('User gesture required', 'NotAllowedError'));
        }
        return originalPlay.call(this);
      };
    `,
    });
    await page.addInitScript(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      save,
    );
    await page.goto(url);
    const start = page.getByRole('button', {
      name: 'Démarrer le logo du studio avec le son',
      exact: true,
    });
    await expect(start).toBeVisible({ timeout: 15000 });
    const poster = await page.getByTestId('studio-poster').boundingBox();
    expect(poster?.width).toBeLessThanOrEqual(393);
    expect(poster?.height).toBeLessThanOrEqual(852);
    await start.click();
    await expect
      .poll(() => page.getByTestId('studio-video').evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0.15);
    expect(await page.getByTestId('studio-video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(
      false,
    );
    await page.getByTestId('studio-skip').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.close();
  } finally {
    await guarded.close();
  }
  console.log(
    'Studio launch passed: original sound, game/audio handoff, pause/resume, one play per cold launch, skip, mute preference, tablet fit, decode error fallback, browser gesture retry and unchanged save.',
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
