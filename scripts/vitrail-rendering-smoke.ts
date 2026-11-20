import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { activeVitrail, openVitrail, rotateVitrail } from '../src/state/vitrail';
import {
  lightColors,
  portKey,
  rotationPeriod,
  traceVitrail,
  vitrailHint,
} from '../src/engine/vitrail';

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
  const now = new Date('2026-11-19T12:00:00Z');
  await page.clock.setFixedTime(now);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8126/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let complete: Save = { ...initial(), started: true, guideSeen: true, seeds: 27 };
  complete.settings = {
    ...complete.settings,
    motion: false,
    sound: false,
    music: false,
    haptics: false,
  };
  for (let level = 0; level < 3; level++) {
    complete = openVitrail(complete, '2026-11-19', level, false, now);
    for (let count = 0; count < 100; count++) {
      const session = complete.vitrail!.session!,
        puzzle = activeVitrail(session)!;
      if (traceVitrail(puzzle, session.rotations).solved) break;
      complete = rotateVitrail(complete, vitrailHint(puzzle, session.rotations)!, now);
    }
  }
  complete.vitrail!.seen = ['mirror', 'splitter', 'mixer'];
  const puzzle = activeVitrail(complete.vitrail!.session!)!;
  const seed = async (save: Save) => {
    await page.goto(url);
    await page.evaluate(
      (value) => localStorage.setItem('color-world.save', JSON.stringify(value)),
      save,
    );
    await page.goto(url + 'vitrail');
    await expect(page.getByTestId('vitrail-board')).toBeVisible();
  };
  const withRotations = (rotations: number[]) => ({
    ...complete,
    vitrail: {
      ...complete.vitrail!,
      session: { ...complete.vitrail!.session!, rotations, history: [], moves: 0 },
    },
  });
  const checkHalos = async () => {
    for (const [index, target] of puzzle.targets.entries()) {
      const halo = page.locator(`#vitrail-target-halo-${index}`);
      await expect(halo).toHaveAttribute('stroke', lightColors[target.color].hex);
      const inside = await halo.evaluate((node) => {
        const svg = (node as unknown as SVGCircleElement).ownerSVGElement!,
          extent = svg.viewBox.baseVal;
        const group = node.parentElement as unknown as SVGGraphicsElement;
        const bounds = group.getBBox();
        // The broad glow has a 26-unit radius and a seven-unit stroke.
        const cx = Number(node.getAttribute('cx')),
          cy = Number(node.getAttribute('cy'));
        return (
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= extent.width &&
          bounds.y + bounds.height <= extent.height &&
          cx - 29.5 >= 0 &&
          cy - 29.5 >= 0 &&
          cx + 29.5 <= extent.width &&
          cy + 29.5 <= extent.height
        );
      });
      expect(inside).toBe(true);
    }
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await seed(withRotations([...puzzle.initial]));
    await checkHalos();
    let wrong: { rotations: number[]; target: number } | undefined;
    for (let cell = 0; cell < puzzle.cells.length && !wrong; cell++)
      for (let rotation = 0; rotation < rotationPeriod(puzzle.cells[cell]); rotation++) {
        const rotations = [...puzzle.solution];
        rotations[cell] = rotation;
        const trace = traceVitrail(puzzle, rotations);
        const target = puzzle.targets.findIndex(
          (port) => !!trace.exits[portKey(port)] && trace.exits[portKey(port)] !== port.color,
        );
        if (target >= 0) {
          wrong = { rotations, target };
          break;
        }
      }
    expect(wrong).toBeDefined();
    await seed(withRotations(wrong!.rotations));
    await checkHalos();
    await expect(page.locator(`#vitrail-target-check-${wrong!.target}`)).toHaveCount(0);
    await page
      .getByTestId('vitrail-play-card')
      .screenshot({ path: 'test-results/vitrail-halos-wrong-light.png' });
    const finalCell = puzzle.cells.findIndex((kind, i) => {
      if (kind !== 'mirror') return false;
      const rotations = [...puzzle.solution];
      rotations[i] = (rotations[i] + 1) % 2;
      return !traceVitrail(puzzle, rotations).solved;
    });
    expect(finalCell).toBeGreaterThanOrEqual(0);
    const rotations = [...puzzle.solution];
    rotations[finalCell] = (rotations[finalCell] + 1) % 2;
    await seed(withRotations(rotations));
    await page.getByTestId(`vitrail-cell-${finalCell}`).click();
    await expect(page.getByTestId('vitrail-victory')).toBeVisible();
    await expect(page.locator('#vitrail-selected-piece')).toHaveCount(0);
    const calendar = page.getByRole('button', { name: 'Voir mon calendrier', exact: true });
    for (const [width, height] of [
      [320, 568],
      [393, 852],
      [432, 960],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      await checkHalos();
      for (let i = 0; i < puzzle.targets.length; i++)
        await expect(page.locator(`#vitrail-target-check-${i}`)).toHaveCount(1);
      const label = calendar.getByText(/^(Voir mon calendrier|Calendrier)$/);
      await expect
        .poll(async () => {
          const b = await calendar.boundingBox(),
            t = await label.boundingBox();
          return (
            !!b &&
            !!t &&
            b.height >= 48 &&
            t.x >= b.x &&
            t.x + t.width <= b.x + b.width + 1 &&
            t.y >= b.y &&
            t.y + t.height <= b.y + b.height + 1
          );
        })
        .toBe(true);
      expect(
        await label.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    // Wait for the portrait branch to commit before capturing its new paper element.
    await expect(
      page.getByTestId('vitrail-play-card').getByTestId('vitrail-actions'),
    ).toBeVisible();
    await page
      .getByTestId('vitrail-play-card')
      .screenshot({ path: 'test-results/vitrail-halos-victory.png' });
    await calendar.click();
    await expect(page.getByTestId('vitrail-calendar')).toBeVisible();
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).seeds),
    ).toBe(28);
    expect(errors).toEqual([]);
    console.log(
      'Vitrail rendering passed: expected-color halos before and after success and under wrong light, unclipped edge decorations, no stale victory selection, full calendar CTA on four phone/landscape layouts, working calendar and unchanged reward.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
