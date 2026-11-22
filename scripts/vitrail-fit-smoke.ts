import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { openVitrail, activeVitrail } from '../src/state/vitrail';
import { vitrailDays } from '../src/data/vitrails';
import { passStudio } from './studio-test-helper';

const formats = [
  [320, 400],
  [320, 432],
  [320, 480],
  [320, 568],
  [360, 640],
  [375, 667],
  [393, 760],
  [393, 852],
  [412, 915],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 900],
  [480, 280],
  [568, 320],
  [667, 375],
  [932, 430],
];
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
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(30000);
  const now = new Date('2027-11-17T12:00:00Z');
  await page.clock.setFixedTime(now);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const check = async () => {
    await expect
      .poll(() =>
        page.getByTestId('vitrail-viewport').evaluate((root) => {
          const box = root.getBoundingClientRect(),
            problems: string[] = [];
          const won = !!root.querySelector('[data-testid="vitrail-victory"]');
          for (const id of [
            'vitrail-header',
            'vitrail-stages',
            'vitrail-board',
            ...(!won ? ['vitrail-caption'] : []),
            'vitrail-actions',
            'vitrail-footer',
          ]) {
            const node = root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
            if (!node) {
              problems.push('missing ' + id);
              continue;
            }
            const b = node.getBoundingClientRect();
            if (
              b.left < box.left - 1 ||
              b.top < box.top - 1 ||
              b.right > box.right + 1 ||
              b.bottom > box.bottom + 1
            )
              problems.push(
                id +
                  ' outside ' +
                  JSON.stringify({
                    root: [box.width, box.height],
                    bounds: [b.x - box.x, b.y - box.y, b.width, b.height],
                  }),
              );
          }
          if (root.scrollHeight > root.clientHeight + 1) problems.push('vertical overflow');
          if (root.scrollWidth > root.clientWidth + 1) problems.push('horizontal overflow');
          const paper = root.querySelector<HTMLElement>('[data-testid="vitrail-play-card"]');
          if (paper?.querySelector('[data-testid="vitrail-actions"]')) {
            const p = paper.getBoundingClientRect(),
              style = getComputedStyle(paper);
            const x = parseFloat(style.paddingLeft),
              y = parseFloat(style.paddingTop);
            const b = root.querySelector('[data-testid="vitrail-board"]')!.getBoundingClientRect();
            const c = root
              .querySelector('[data-testid="vitrail-caption"]')
              ?.getBoundingClientRect();
            const a = root
              .querySelector('[data-testid="vitrail-actions"]')!
              .getBoundingClientRect();
            const group = c ? [b, c, a] : [b, a];
            for (const r of group)
              if (
                r.left < p.left + x - 1 ||
                r.right > p.right - x + 1 ||
                r.top < p.top + y - 1 ||
                r.bottom > p.bottom - y + 1
              )
                problems.push('content overlaps reserved paper border');
            for (let i = 1; i < group.length; i++)
              if (group[i].top - group[i - 1].bottom < -1 || group[i].top - group[i - 1].bottom > 7)
                problems.push('board and controls are separated');
            if (Math.abs(b.top - p.top - (p.bottom - a.bottom)) > 1)
              problems.push('play group not centered in paper');
            if (Math.abs(b.top - p.top - y) > 1 || Math.abs(p.bottom - a.bottom - y) > 1)
              problems.push('unused paper height around the play group');
          }
          const footer = root.querySelector<HTMLElement>('[data-testid="vitrail-footer"]')!;
          const f = footer.getBoundingClientRect(),
            inset = parseFloat(getComputedStyle(footer).paddingLeft);
          for (const button of Array.from(footer.querySelectorAll('[role="button"]'))) {
            const b = button.getBoundingClientRect();
            if (
              b.left < f.left + inset - 1 ||
              b.right > f.right - inset + 1 ||
              b.top < f.top + inset - 1 ||
              b.bottom > f.bottom - inset + 1
            )
              problems.push('footer button touches outside border');
          }
          for (const node of Array.from(root.querySelectorAll<HTMLElement>('div, span'))) {
            if (
              !Array.from(node.childNodes).some(
                (child) => child.nodeType === 3 && child.textContent?.trim(),
              ) ||
              !node.clientWidth ||
              !node.clientHeight
            )
              continue;
            const style = getComputedStyle(node);
            if (
              style.overflowX !== 'hidden' &&
              style.overflowY !== 'hidden' &&
              style.textOverflow !== 'ellipsis'
            )
              continue;
            if (
              node.scrollWidth > node.clientWidth + 1 ||
              node.scrollHeight > node.clientHeight + 1
            )
              problems.push(
                'clipped text: ' +
                  node.textContent +
                  ' ' +
                  JSON.stringify({
                    viewport: [box.width, box.height],
                    width: node.clientWidth,
                    scrollWidth: node.scrollWidth,
                    height: node.clientHeight,
                    scrollHeight: node.scrollHeight,
                  }),
              );
          }
          return problems;
        }),
      )
      .toEqual([]);
    await expect(page.getByTestId('book-page-scroll')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  };
  const seed = async (day: string, level: number, won: boolean) => {
    let s: Save = {
      ...initial(),
      started: true,
      guideSeen: true,
      seeds: 28,
      vitrail: {
        version: 1,
        days: { [day]: { completed: 3, rewarded: true } },
        seen: ['mirror', 'splitter', 'mixer'],
      },
    };
    s.settings = { ...s.settings, motion: false, sound: false, music: false, haptics: false };
    s = openVitrail(s, day, level, true, now);
    if (won) s.vitrail!.session!.rotations = [...activeVitrail(s.vitrail!.session!)!.solution];
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + 'vitrail?day=' + day);
    await passStudio(page);
    await expect(page.getByTestId('vitrail-viewport')).toBeVisible();
  };
  mkdirSync('test-results', { recursive: true });
  try {
    for (const day of [vitrailDays[1].day, vitrailDays[180].day, vitrailDays[364].day])
      for (let level = 0; level < 3; level++)
        for (const won of [false, true]) {
          await seed(day, level, won);
          if (!won) {
            await page.getByRole('button', { name: 'Indice', exact: true }).click();
            await expect(page.getByTestId('vitrail-hint')).toBeVisible();
          }
          for (const [width, height] of formats) {
            await page.setViewportSize({ width, height });
            await check();
          }
        }
    for (const [width, height] of [
      [393, 852],
      [568, 320],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        const root = document.getElementById('root')!;
        root.style.paddingTop = '24px';
        root.style.paddingBottom = '24px';
        root.style.boxSizing = 'border-box';
      });
      await check();
      const cell = (await page.locator('[data-testid^="vitrail-cell-"]').first().boundingBox())!;
      expect(cell.width).toBeGreaterThanOrEqual(43.9);
      await page.evaluate(() => {
        const root = document.getElementById('root')!;
        root.style.paddingTop = '';
        root.style.paddingBottom = '';
      });
    }
    await seed(vitrailDays[1].day, 2, false);
    await page.setViewportSize({ width: 393, height: 852 });
    await check();
    await page.screenshot({ path: 'test-results/vitrail-fit-portrait.png' });
    await page.setViewportSize({ width: 932, height: 430 });
    await check();
    await page.screenshot({ path: 'test-results/vitrail-fit-landscape.png' });
    await page.getByRole('button', { name: 'Mon calendrier', exact: true }).click();
    await expect(page.getByTestId('vitrail-calendar')).toBeVisible();
    expect(errors).toEqual([]);
    console.log(
      'Vitrail fit passed: early/mid/late-year puzzles, all 3 difficulties in play with hint and in victory, 19 phone/tablet/landscape formats, no page scrolling or hidden controls, safe-area reductions, reachable calendar and 44px cells on standard safe phone viewports.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
