import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { openVitrail } from '../src/state/vitrail';
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
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(30000);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const fixture = (
    day: string,
    entries: Record<string, { completed: number; rewarded: boolean }>,
    now: Date,
    motion = false,
  ) => {
    let save: Save = {
      ...initial(),
      started: true,
      guideSeen: true,
      seeds: 28,
      vitrail: { version: 1, seen: ['mirror', 'splitter', 'mixer'], days: entries },
    };
    save.settings = { ...save.settings, motion, sound: false, music: false, haptics: false };
    return openVitrail(save, day, Math.min(entries[day]?.completed ?? 0, 2), true, now);
  };
  const seed = async (save: Save, now: Date) => {
    await page.clock.setFixedTime(now);
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url + 'vitrail?day=' + save.vitrail!.session!.day);
    await passStudio(page);
    await expect(page.getByTestId('vitrail-board')).toBeVisible();
    await button('Mon calendrier').click();
    await expect(page.getByTestId('vitrail-calendar')).toBeVisible();
  };
  const fits = async () => {
    await expect
      .poll(() =>
        page.getByTestId('calendar-modal-viewport').evaluate((root) => {
          const r = root.getBoundingClientRect(),
            problems: string[] = [];
          const paper = root.querySelector<HTMLElement>('[data-testid="vitrail-calendar"]')!,
            p = paper.getBoundingClientRect();
          if (
            p.left < r.left - 1 ||
            p.top < r.top - 1 ||
            p.right > r.right + 1 ||
            p.bottom > r.bottom + 1
          )
            problems.push('paper outside modal');
          for (const id of ['calendar-month-controls', 'calendar-close']) {
            const b = root.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
            if (
              b.left < p.left + 6 ||
              b.top < p.top + 6 ||
              b.right > p.right - 6 ||
              b.bottom > p.bottom - 6
            )
              problems.push(id + ' touches border');
          }
          if (
            paper.scrollHeight > paper.clientHeight + 1 ||
            paper.scrollWidth > paper.clientWidth + 1
          )
            problems.push('paper content overflow');
          for (const node of Array.from(paper.querySelectorAll<HTMLElement>('div,span'))) {
            if (
              !node.clientWidth ||
              !node.clientHeight ||
              !Array.from(node.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim())
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
                'clipped ' +
                  node.textContent +
                  ' ' +
                  JSON.stringify([
                    node.clientWidth,
                    node.scrollWidth,
                    node.clientHeight,
                    node.scrollHeight,
                  ]),
              );
          }
          return problems;
        }),
      )
      .toEqual([]);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    const now = new Date('2026-11-19T12:00:00Z');
    const base = fixture(
      '2026-11-19',
      {
        '2026-11-18': { completed: 3, rewarded: true },
        '2026-11-19': { completed: 3, rewarded: true },
      },
      now,
    );
    await seed(base, now);
    await fits();
    await expect(page.getByTestId('calendar-stamp-2026-11-18')).toBeVisible();
    await expect(page.getByTestId('calendar-stamp-2026-11-19')).toBeVisible();
    await expect(page.getByTestId('calendar-month-summary')).toContainText(
      '2 journées estampillées',
    );
    await expect(page.getByTestId('calendar-living-vine')).toHaveCount(1);
    await expect(page.getByTestId('calendar-today-halo')).toHaveCount(1);
    await expect(page.getByTestId('calendar-glow-still')).toHaveCount(1);
    await expect(page.getByTestId('vitrail-calendar-2026-11-20')).toBeDisabled();
    await expect(page.getByTestId('vitrail-calendar-2026-11-17')).toBeDisabled();
    await expect(button('Mois précédent')).toBeDisabled();
    await expect(button('Mois suivant')).toBeDisabled();
    await page
      .getByTestId('vitrail-calendar')
      .screenshot({ path: 'test-results/vitrail-calendar-stamps.png' });
    const before = await stored();
    for (const [width, height] of [
      [320, 400],
      [320, 568],
      [393, 760],
      [393, 852],
      [430, 932],
      [768, 1024],
      [820, 1180],
      [480, 280],
      [568, 320],
      [932, 430],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height });
      await fits();
      if (width === 320 && height === 568)
        await page
          .getByTestId('vitrail-calendar')
          .screenshot({ path: 'test-results/vitrail-calendar-small-phone.png' });
      if (width === 932 && height === 430)
        await page
          .getByTestId('vitrail-calendar')
          .screenshot({ path: 'test-results/vitrail-calendar-landscape.png' });
    }
    expect(await stored()).toEqual(before);
    await page.setViewportSize({ width: 393, height: 852 });
    await fits();
    await page.getByTestId('vitrail-calendar-2026-11-18').click();
    await expect(page.getByTestId('vitrail-date')).toHaveText('18 novembre');
    expect((await stored()).seeds).toBe(28);
    expect((await stored()).vitrail!.days).toEqual(before.vitrail!.days);
    await seed(
      fixture(
        '2026-11-19',
        {
          '2026-11-18': { completed: 3, rewarded: false },
          '2026-11-19': { completed: 2, rewarded: false },
        },
        now,
      ),
      now,
    );
    await expect(page.getByTestId('calendar-progress-2026-11-19')).toBeVisible();
    await expect(page.getByTestId('calendar-stamp-2026-11-19')).toHaveCount(0);
    await expect(page.getByTestId('calendar-month-summary')).toContainText('1 journée estampillée');
    await button('Fermer le calendrier').click();
    await expect(page.getByTestId('vitrail-calendar')).toHaveCount(0);
    const later = new Date('2027-11-17T12:00:00Z');
    const entries = Object.fromEntries(
      Array.from({ length: 31 }, (_, i) => [
        `2027-05-${String(i + 1).padStart(2, '0')}`,
        { completed: 3, rewarded: false },
      ]),
    );
    await seed(fixture('2027-05-31', entries, later), later);
    await fits();
    await expect(page.locator('[data-testid^="calendar-stamp-"]')).toHaveCount(31);
    await expect(page.getByTestId('calendar-month-summary')).toContainText(
      '31 journées estampillées',
    );
    await page
      .getByTestId('vitrail-calendar')
      .screenshot({ path: 'test-results/vitrail-calendar-full-month.png' });
    const ledger = await stored();
    await button('Mois précédent').click();
    await expect(page.getByTestId('calendar-month-title')).toHaveText('avril 2027');
    await button('Mois suivant').click();
    await expect(page.getByTestId('calendar-month-title')).toHaveText('mai 2027');
    await button('Afficher le mois d’aujourd’hui').click();
    await expect(page.getByTestId('calendar-month-title')).toHaveText('novembre 2027');
    await expect(button('Mois suivant')).toBeDisabled();
    await expect(page.getByTestId('vitrail-calendar-2027-11-18')).toBeDisabled();
    expect(await stored()).toEqual(ledger);
    const moving = fixture('2026-11-19', base.vitrail!.days, now, true);
    await seed(moving, now);
    // React Native Animated uses Date.now(); a fixed date would freeze the halo itself.
    await page.clock.setSystemTime(now);
    await expect(page.getByTestId('calendar-glow-running')).toHaveCount(1);
    const halo = page.getByTestId('calendar-today-halo'),
      alpha = await halo.evaluate((n) => getComputedStyle(n).opacity);
    await expect
      .poll(() => halo.evaluate((n) => getComputedStyle(n).opacity), { timeout: 5000 })
      .not.toBe(alpha);
    await button('Fermer le calendrier').click();
    await expect(page.getByTestId('calendar-today-halo')).toHaveCount(0);
    expect((await stored()).seeds).toBe(28);
    expect(errors).toEqual([]);
    console.log(
      'Enchanted calendar passed: botanical stamps from existing archives, partial leaves, living vine, current-day halo, 11 layouts, complete month, month limits and today shortcut, date selection, motion/reduced motion and strictly read-only wallet/progress.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
