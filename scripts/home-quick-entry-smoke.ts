import { passStudio } from './studio-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial } from '../src/state/model';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  mkdirSync('test-results', { recursive: true });
  try {
    for (const scenario of [
      { target: 'play', motion: true, guide: true, destination: 'page-folio' },
      { target: 'herbarium', motion: true, guide: true, destination: 'herbarium-collection-title' },
      { target: 'ecosystem', motion: true, guide: true, destination: 'ecosystems-screen' },
      { target: 'day', motion: true, guide: true, destination: 'daily-vitrail-screen' },
      { target: 'play', motion: true, guide: false, destination: 'botanical-guide' },
      { target: 'play', motion: false, guide: true, destination: 'page-folio' },
    ]) {
      const page = await browser.newPage({
        viewport: { width: 393, height: 852 },
        serviceWorkers: 'block',
      });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const save = { ...initial(), started: true, guideSeen: scenario.guide, nickname: 'Camille' };
      save.settings = {
        ...save.settings,
        motion: scenario.motion,
        music: false,
        sound: false,
        haptics: false,
      };
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        save,
      );
      await page.addInitScript({ content: 'window.__name=value=>value;' });
      // Arm the tap before mounting the shell: browser polling can outlast the
      // entrance on a CPU-throttled cold launch with fonts and native assets.
      const selector =
        scenario.target === 'play'
          ? '[data-testid=home-restore-action] button'
          : scenario.target === 'day'
            ? '[data-testid=home-future-day]'
            : scenario.target === 'herbarium'
              ? '[aria-label="Herbier"][role=link]'
              : '[aria-label="Écosystèmes"][role=link]';
      await page.addInitScript(
        ({ selector, destination }) => {
          (window as any).quickEntryReady = new Promise((resolve) => {
            let clicked = false;
            const events: { event: string; time: number }[] = [];
            (window as any).quickEntryEvents = events;
            let stable = false;
            const watch = new MutationObserver(() => {
              const control = document.querySelector(selector) as HTMLElement | null;
              const early = !!document.querySelector('[data-testid=home-stage-unfolding]');
              const settled = !!document.querySelector('[data-testid=home-stage-settled]');
              if (!clicked && control && (early || settled)) {
                clicked = true;
                stable = settled;
                const historyBefore = history.length;
                events.push({ event: 'click', time: performance.now() });
                control.click();
                control.click();
                control.click();
                resolve({ clickedDuringIntro: early, historyBefore });
              }
              if (!clicked) return;
              if (settled && !stable) {
                stable = true;
                events.push({ event: 'menu-settled', time: performance.now() });
              }
              if (document.querySelector(`[data-testid="${destination}"]`)) {
                events.push({
                  event: stable ? 'destination-after-settle' : 'destination-during-intro',
                  time: performance.now(),
                });
                watch.disconnect();
              }
            });
            watch.observe(document, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ['data-testid'],
            });
          });
        },
        { selector, destination: scenario.destination },
      );
      try {
        await page.goto(url);
        await passStudio(page);
        const { clickedDuringIntro, historyBefore } = await page.evaluate(
          () => (window as any).quickEntryReady,
        );
        expect(clickedDuringIntro, JSON.stringify(scenario)).toBe(scenario.motion);
        await expect(page.getByTestId(scenario.destination)).toBeVisible();
        expect(await page.evaluate(() => history.length)).toBe(historyBefore + 1);
        const events = await page.evaluate(
          () => (window as any).quickEntryEvents as { event: string; time: number }[],
        );
        expect(events.some((e) => e.event === 'destination-during-intro')).toBe(false);
        expect(events.some((e) => e.event === 'destination-after-settle')).toBe(true);
        expect(events.filter((e) => e.event.startsWith('destination-'))).toHaveLength(1);
        const after = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('color-world.save')!),
        );
        if (scenario.target === 'day') {
          expect({ ...after, vitrail: undefined }).toEqual({ ...save, vitrail: undefined });
          expect(after.vitrail.session.level).toBe(0);
        } else expect(after).toEqual(save);
        expect(errors).toEqual([]);
        writeFileSync(
          `test-results/quick-entry-${scenario.target}-${scenario.motion}-${scenario.guide}.json`,
          JSON.stringify(events, null, 2),
        );
      } finally {
        await page.close();
      }
    }
    console.log(
      'Quick menu entry passed: immediate triple taps during the entrance settle the menu before the game, herbarium, ecosystems or first guide; no duplicate destination, unchanged save, reduced motion and 4× CPU throttling.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
