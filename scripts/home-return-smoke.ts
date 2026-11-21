import { passStudio } from './studio-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial } from '../src/state/model';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  mkdirSync('test-results', { recursive: true });
  try {
    for (const motion of [true, false]) {
      const page = await browser.newPage({
        viewport: { width: 393, height: 852 },
        serviceWorkers: 'block',
      });
      const cdp = await page.context().newCDPSession(page);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const save = {
        ...initial(),
        started: true,
        guideSeen: true,
        settings: { ...initial().settings, motion, music: false, sound: false, haptics: false },
      };
      await page.addInitScript(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        save,
      );
      await page.addInitScript({ content: 'window.__name=value=>value;' });
      await page.goto(url);
      await passStudio(page);
      const home = page.getByTestId('home-screen');
      await expect(home).toBeVisible();
      await expect(page.getByTestId('home-stage-settled')).toBeAttached();
      await expect(page.getByTestId('home-restoration-card').locator('svg').first()).toBeAttached();
      await page.evaluate(() => {
        (window as any).cachedHomeCard = document.querySelector(
          '[data-testid="home-restoration-card"]',
        );
        (window as any).cachedHomeSvg = document.querySelector(
          '[data-testid="home-restoration-card"] svg',
        );
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const timings: unknown[] = [];
      for (const destination of ['campaign', 'campaign', 'daily']) {
        if (destination === 'daily') await page.getByTestId('home-future-day').click();
        else if (timings.length === 0) {
          await page.getByRole('button', { name: /^Graines dorées/ }).click();
          await expect(page.getByTestId('seed-explanation')).toBeVisible();
          // A queued navigation must also dispose a portal owned by the inactive menu.
          await page
            .getByTestId('home-restore-action')
            .getByRole('button')
            .evaluate((node) => (node as HTMLElement).click());
        } else await page.getByTestId('home-restore-action').getByRole('button').click();
        await expect(
          page.getByTestId(destination === 'daily' ? 'daily-vitrail-screen' : 'page-folio'),
        ).toBeVisible();
        if (destination === 'daily' && (await page.getByTestId('vitrail-lesson-title').isVisible()))
          await page.getByRole('button', { name: 'J’ai compris', exact: true }).click();
        await expect(home).toBeHidden();
        await expect(page.getByTestId('seed-explanation')).toHaveCount(0);
        await expect(page.getByTestId('home-route-cache')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.getByTestId('home-restoration-enchantment')).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Herbier', exact: true })).toHaveCount(0);
        const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
        await page.evaluate(() => {
          const events: { event: string; time: number }[] = [];
          let visibleAt = 0,
            overlapping = false;
          let entranceStarted = false;
          let firstAmbient: Element | null = null;
          let ambientReplaced = false;
          const watch = new MutationObserver(() => {
            const root = document.querySelector('[data-testid="home-route-cache"]');
            if (!root || root.getAttribute('aria-hidden') === 'true') return;
            if (!visibleAt) {
              visibleAt = performance.now();
              events.push({ event: 'visible', time: visibleAt });
            }
            const unfolding = root.querySelector('[data-testid="home-stage-unfolding"]');
            const ambient = root.querySelector('[data-testid="home-restoration-enchantment"]');
            if (unfolding) entranceStarted = true;
            if (unfolding && ambient) overlapping = true;
            if (firstAmbient && ambient !== firstAmbient) ambientReplaced = true;
            if (ambient && !firstAmbient) firstAmbient = ambient;
            if (ambient && !events.some((e) => e.event === 'ambient'))
              events.push({ event: 'ambient', time: performance.now() });
            if (
              entranceStarted &&
              root.querySelector('[data-testid="home-stage-settled"]') &&
              !events.some((e) => e.event === 'settled')
            )
              events.push({ event: 'settled', time: performance.now() });
          });
          watch.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['data-testid', 'aria-hidden'],
          });
          (window as any).returnCheck = {
            finish() {
              watch.disconnect();
              return { events, overlapping, ambientReplaced };
            },
          };
        });
        await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
        await expect(home).toBeVisible();
        await expect(page.getByTestId('home-stage-settled')).toBeAttached();
        if (motion) await expect(page.getByTestId('home-restoration-enchantment')).toBeVisible();
        const identity = await page.evaluate(() => ({
          card:
            (window as any).cachedHomeCard ===
            document.querySelector('[data-testid="home-restoration-card"]'),
          drawing:
            (window as any).cachedHomeSvg ===
            document.querySelector('[data-testid="home-restoration-card"] svg'),
        }));
        expect(identity).toEqual({ card: true, drawing: true });
        const result = await page.evaluate(() => (window as any).returnCheck.finish());
        expect(result.overlapping).toBe(motion);
        expect(result.ambientReplaced).toBe(false);
        if (motion) {
          const settled = result.events.find((e: any) => e.event === 'settled').time;
          const ambient = result.events.find((e: any) => e.event === 'ambient').time;
          expect(settled - result.events[0].time).toBeGreaterThan(2300);
          expect(ambient).toBeLessThan(settled);
        }
        timings.push({ destination, ...result });
        expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
      }
      expect(errors).toEqual([]);
      writeFileSync(`test-results/home-return-${motion}.json`, JSON.stringify(timings, null, 2));
      await page.goto(new URL('atelier', url).href);
      await passStudio(page);
      await expect(page.getByTestId('page-folio')).toBeVisible();
      await expect(page.getByTestId('home-screen')).toHaveCount(0);
      await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
      await expect(home).toBeVisible();
      await page.close();
    }
    console.log(
      'Home return passed: same card and SVG nodes across repeated campaign/daily returns, inaccessible inactive menu, stopped effects, unchanged entrance duration, overlapping ambient motion without replacement at entry completion, unchanged save and 4× CPU.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
