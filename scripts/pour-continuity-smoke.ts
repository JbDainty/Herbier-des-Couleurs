import { chromium, expect } from '@playwright/test';
import levels from '../src/data/campaign';
import { mechanicIds } from '../src/engine/mechanics';
import { capacity, pour } from '../src/engine/puzzle';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import { acquireGarden } from '../src/state/economy';
import { loadGardenPage } from '../src/state/gardens';
import { passStudio } from './studio-test-helper';

async function main() {
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const real = { ...initial(), started: true, guideSeen: true, seenMechanics: [...mechanicIds] };
  real.settings = { ...real.settings, sound: false, music: false, haptics: false };
  const seed = async (save: Save, route = 'atelier') => {
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url + route);
    await passStudio(page);
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
  };
  const transfer = async (from: number, to: number) => {
    for (const tube of [from, to])
      await page.getByRole('button', { name: new RegExp(`^Flacon ${tube + 1},`) }).click();
  };
  try {
    await page.goto(url);
    await passStudio(page);
    await seed(real);
    const first = levels[0].solution[0];
    await transfer(first.from, first.to);
    const stream = await page.locator('#pour-jet').evaluateHandle((firstJet) => {
      const board = firstJet.closest('[data-testid="liquid-board-pouring"]')!;
      const missingPaint: string[] = [];
      board.querySelectorAll('svg [fill], svg [stroke], svg [clip-path]').forEach((shape) => {
        for (const attribute of ['fill', 'stroke', 'clip-path']) {
          const id = shape.getAttribute(attribute)?.match(/^url\(#([^)]+)\)$/)?.[1];
          if (id && !shape.closest('svg')?.querySelector('#' + CSS.escape(id)))
            missingPaint.push(id);
        }
      });
      const jets = new Set<Element>([firstJet]);
      const observer = new MutationObserver(() => {
        const current = board.querySelector('#pour-jet');
        if (current) jets.add(current);
      });
      observer.observe(board, { childList: true, subtree: true });
      return { jets, observer, missingPaint };
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    const jetsAfterRotation = await stream.evaluate(({ jets, observer }) => {
      observer.disconnect();
      return jets.size;
    });
    expect(
      await stream.evaluate(({ missingPaint }) => missingPaint),
      'all paints resolve in their own layer during a pour',
    ).toEqual([]);
    expect(jetsAfterRotation, 'one continuous stream per move').toBe(1);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('color-world.save')!) as Save,
    );
    expect(saved.moves).toBe(1);
    expect(saved.board).toEqual(pour(real.board, first.from, first.to));

    await page.setViewportSize({ width: 393, height: 852 });
    // The second transfer on page 36 completes a three-unit vial.
    const level = levels[35];
    const [setup, finish] = level.solution;
    const attempt = loadLevel({ ...real, testSession: { returnSave: real } }, level.id);
    expect(capacity(level.rules, finish.to)).toBe(3);
    await seed(move(attempt, setup.from, setup.to));
    await transfer(finish.from, finish.to);
    const bloom = page.getByTestId('completed-vial-bloom');
    await expect(bloom).toBeVisible();
    const placement = await bloom.evaluate((overlay, tube) => {
      const glass = document.querySelector(`[data-testid="tube-insignia-${tube}"]`)!
        .parentElement as unknown as SVGGraphicsElement;
      const basis = glass.getScreenCTM()!;
      const bounds = overlay.getBoundingClientRect();
      return [
        bounds.x + bounds.width / 2 - basis.e,
        bounds.y + (bounds.width * 24) / 88 - basis.f,
        bounds.width - 88 * basis.a,
      ];
    }, finish.to);
    for (const offset of placement)
      expect(Math.abs(offset), 'bloom follows the glass to within a pixel').toBeLessThan(1);

    const purchased = {
      ...real,
      seeds: 500,
      wallpaper: 'ecosystem-0',
      ownedWallpapers: ['ecosystem-0'],
    };
    const garden = acquireGarden(purchased, 'orchidees-lumiere', new Date('2026-11-17'));
    await seed(loadGardenPage(garden, 'orchidees-lumiere', 'aurore', 0), 'jardin');
    await expect(
      page.getByTestId('garden-puzzle').getByTestId('workshop-wallpaper').locator('img'),
    ).toHaveAttribute('src', /\/illustrations\/serre\./);
    expect(errors).toEqual([]);
    console.log(
      'Rotation keeps one stream and one saved move, the bloom follows a small vial, and collection glass keeps its own background.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
