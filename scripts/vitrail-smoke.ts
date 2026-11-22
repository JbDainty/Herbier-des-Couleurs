import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { activeVitrail } from '../src/state/vitrail';
import { rotationPeriod, traceVitrail, vitrailHint } from '../src/engine/vitrail';
import { passStudio } from './studio-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const finishedTabs = page.getByRole('tab', { name: /, terminé$/ });
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const lessons = async () => {
    while (await page.getByTestId('vitrail-lesson').isVisible())
      await button('J’ai compris').click();
  };
  const finish = async () => {
    await lessons();
    for (let limit = 0; limit < 100; limit++) {
      const save = await stored(),
        session = save.vitrail!.session!,
        puzzle = activeVitrail(session)!;
      if (traceVitrail(puzzle, session.rotations).solved) return;
      const cell = vitrailHint(puzzle, session.rotations)!;
      await page.getByTestId(`vitrail-cell-${cell}`).click();
      await expect
        .poll(async () => (await stored()).vitrail!.session!.rotations[cell])
        .toBe((session.rotations[cell] + 1) % rotationPeriod(puzzle.cells[cell]));
    }
    throw Error('UI hints did not converge');
  };
  mkdirSync('test-results', { recursive: true });
  try {
    const base = { ...initial(), started: true, guideSeen: true, nickname: 'Vitrail', seeds: 20 };
    base.settings = { ...base.settings, motion: false, music: false, sound: false, haptics: false };
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), base);
    await page.reload();
    await passStudio(page);
    await page.getByTestId('home-future-day').click();
    await expect(page.getByTestId('daily-vitrail-screen')).toBeVisible();
    await expect(page.getByTestId('vitrail-lesson-title')).toHaveText('Les miroirs du vitrail');
    await button('J’ai compris').click();
    await expect(finishedTabs).toHaveCount(0);
    await expect(page.getByTestId('vitrail-stage-0')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('vitrail-stage-1')).toBeDisabled();
    await expect(page.getByTestId('vitrail-stage-2')).toBeDisabled();
    await expect(page.getByTestId('vitrail-reward')).toHaveCount(0);
    for (const tool of ['undo', 'hint', 'restart']) {
      await expect(page.getByTestId(`vitrail-tool-icon-${tool}`)).toBeVisible();
    }
    expect(await page.getByText(/étoiles|rotations/i).count()).toBe(0);
    const original = (await stored()).vitrail!.session!;
    const cell = vitrailHint(activeVitrail(original)!, original.rotations)!;
    await page.getByTestId(`vitrail-cell-${cell}`).click();
    const partial = (await stored()).vitrail!.session!;
    await page.reload();
    await passStudio(page);
    await expect(page.getByTestId('vitrail-board')).toBeVisible();
    expect((await stored()).vitrail!.session).toEqual(partial);
    await expect(page.getByTestId('vitrail-lesson')).toHaveCount(0);
    await button('Annuler').click();
    expect((await stored()).vitrail!.session!.rotations).toEqual(original.rotations);
    await button('Indice').click();
    await expect(page.getByTestId('vitrail-hint')).toContainText('Faites pivoter');
    await finish();
    await expect(finishedTabs).toHaveCount(1);
    expect((await stored()).seeds).toBe(20);
    await button('Passer au vitrail 2').click();
    await expect(page.getByTestId('vitrail-stage-1')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('vitrail-lesson-title')).toHaveText('Le séparateur de lumière');
    await button('J’ai compris').click();
    for (const [width, height] of [
      [320, 568],
      [393, 852],
      [932, 430],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width, height });
      const board = page.getByTestId('vitrail-board');
      await expect
        .poll(async () => {
          const bounds = await board.boundingBox();
          const cell = await page.locator('[data-testid^="vitrail-cell-"]').first().boundingBox();
          return (
            !!bounds &&
            !!cell &&
            bounds.x >= 0 &&
            bounds.x + bounds.width <= width + 1 &&
            cell.width >= 43.9 &&
            cell.height >= 43.9
          );
        })
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await page.screenshot({ path: 'test-results/vitrail-mobile.png', fullPage: true });
    await finish();
    expect((await stored()).seeds).toBe(20);
    await button('Passer au vitrail 3').click();
    await expect(page.getByTestId('vitrail-lesson-title')).toHaveText('Les couleurs de la lumière');
    await button('J’ai compris').click();
    await finish();
    await expect(finishedTabs).toHaveCount(3);
    await expect(page.getByTestId('vitrail-reward')).toContainText('Graine du jour obtenue');
    expect((await stored()).seeds).toBe(21);
    const earned = await stored();
    await page.reload();
    await passStudio(page);
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    await button('Rejouer ce vitrail').click();
    await finish();
    expect((await stored()).seeds).toBe(21);
    await page.clock.setFixedTime(new Date('2026-11-19T12:00:00Z'));
    await expect(page.getByTestId('vitrail-date')).toHaveText('19 novembre');
    await expect(finishedTabs).toHaveCount(0);
    await button('Mon calendrier').click();
    await expect(page.getByTestId('vitrail-calendar')).toBeVisible();
    await expect(page.getByTestId('vitrail-calendar-2026-11-20')).toBeDisabled();
    await page.getByTestId('vitrail-calendar-2026-11-18').click();
    await expect(page.getByTestId('vitrail-date')).toHaveText('18 novembre');
    await expect(finishedTabs).toHaveCount(3);
    await finish();
    expect((await stored()).seeds).toBe(21);
    await button('Aujourd’hui').click();
    await expect(page.getByTestId('vitrail-date')).toHaveText('19 novembre');
    await context.setOffline(true);
    for (let stage = 0; stage < 3; stage++) {
      await finish();
      if (stage < 2) await button(`Passer au vitrail ${stage + 2}`).click();
    }
    expect((await stored()).seeds).toBe(22);
    await context.setOffline(false);
    const end = await stored();
    expect(end.completed).toEqual(base.completed);
    expect(end.board).toEqual(base.board);
    expect(end.gardens).toEqual(base.gardens);
    expect(end.vitrail!.days['2026-11-18']).toEqual(earned.vitrail!.days['2026-11-18']);
    await page.clock.setFixedTime(new Date('2027-11-18T12:00:00Z'));
    await expect(page.getByTestId('vitrail-unavailable')).toBeVisible();
    expect((await stored()).seeds).toBe(22);
    expect(errors).toEqual([]);
    console.log(
      'Daily vitrail passed: real home entry, three progressive levels and lessons, exact resume and undo, free hints, four layouts with 44px controls, one seed only after three, no replay/archive rewards, automatic date rollover, offline trio, unchanged campaign/collections, explicit end of bank.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
