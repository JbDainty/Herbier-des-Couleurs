import { chromium, expect } from '@playwright/test';
import { initial } from '../src/state/model';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const save = {
    ...initial(),
    started: true,
    guideSeen: true,
    settings: { ...initial().settings, motion: true, music: false, sound: false, haptics: false },
  };
  await page.addInitScript(
    (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
    save,
  );
  await page.addInitScript({ content: 'window.__name=value=>value;' });
  try {
    await page.goto(url);
    const active = page.getByTestId('home-garden-animating');
    await expect(active).toBeVisible();
    await expect(page.getByTestId('home-living-book')).toHaveCount(0);
    await page.evaluate(() => {
      (window as any).gardenSvgChanges = 0;
      new MutationObserver((rs) => {
        for (const r of rs) if (r.target instanceof SVGElement) (window as any).gardenSvgChanges++;
      }).observe(document.querySelector('[data-testid=home-screen]')!, {
        subtree: true,
        attributes: true,
      });
    });
    const fireflies = page.getByTestId('home-clearing-fireflies');
    const enchantments = ['home-restoration-enchantment', 'home-vitrail-enchantment'];
    for (const id of enchantments) await expect(page.getByTestId(id)).toBeVisible();
    const pollen = page.getByTestId(enchantments[0]);
    const pollenTransform = await pollen.evaluate((n) => getComputedStyle(n).transform);
    const transform = await fireflies.evaluate((n) => getComputedStyle(n).transform);
    await expect
      .poll(() => fireflies.evaluate((n) => getComputedStyle(n).transform))
      .not.toBe(transform);
    await expect
      .poll(() => pollen.evaluate((n) => getComputedStyle(n).transform))
      .not.toBe(pollenTransform);
    // Motion should be visible within a short glance, including near a turning point.
    const motionSamples: { illustration: number; pollen: number }[] = [];
    for (let i = 0; i < 6; i++) {
      if (i) await page.waitForTimeout(400);
      motionSamples.push(
        await page.evaluate(() => {
          const y = (id: string) =>
            new DOMMatrix(
              getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!).transform,
            ).m42;
          return {
            illustration: y('home-restoration-illustration'),
            pollen: y('home-restoration-enchantment'),
          };
        }),
      );
    }
    const span = (key: keyof (typeof motionSamples)[number]) =>
      Math.max(...motionSamples.map((s) => s[key])) - Math.min(...motionSamples.map((s) => s[key]));
    expect(span('illustration')).toBeGreaterThan(1.8);
    expect(span('pollen')).toBeGreaterThan(2.5);
    expect(await page.evaluate(() => (window as any).gardenSvgChanges)).toBe(0);
    // Exercise the same AppState visibility event used by the Web adapter.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(active).toHaveCount(0);
    await expect(page.getByTestId('home-garden-still')).toBeAttached();
    for (const id of enchantments) await expect(page.getByTestId(id)).toHaveCount(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(active).toBeVisible();
    for (const id of enchantments) await expect(page.getByTestId(id)).toBeVisible();
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('page-folio')).toBeVisible();
    await expect(active).toHaveCount(0);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!)),
    ).toEqual(save);
    await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
    await expect(active).toBeVisible();
    await page.close();
    const still = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await still.addInitScript((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), {
      ...save,
      settings: { ...save.settings, motion: false },
    });
    await still.goto(url);
    await expect(still.getByTestId('home-stage-settled')).toBeAttached();
    await expect(still.getByTestId('home-garden-still')).toBeVisible();
    await expect(still.getByTestId('home-clearing-fireflies')).toHaveCount(0);
    await expect(still.getByTestId('home-garden-fern')).toHaveCount(0);
    for (const id of enchantments) await expect(still.getByTestId(id)).toHaveCount(0);
    await expect(still.getByTestId('home-restoration-art')).toBeVisible();
    await expect(still.getByTestId('home-vitrail-art')).toBeVisible();
    expect(errors).toEqual([]);
    await still.close();
    console.log(
      'Home garden passed: shared clearing/card clock, animated pollen and illustrations, unchanged SVG geometry, paused/resumed by AppState, disposed on play, restarted on return, static illustrated reduced-motion menu and unchanged save.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
