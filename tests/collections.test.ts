import { expect, it } from 'vitest';
import levels from '../src/data/campaign';
import { collections, featuredCollection } from '../src/data/collections';
import {
  acquireGarden,
  acquireGardenSpecies,
  acquireWallpaper,
  wallpapers,
} from '../src/state/economy';
import {
  initial,
  loadLevel,
  move,
  purchaseHint,
  remixPage,
  restore,
  reward,
} from '../src/state/model';
import {
  gardenPuzzle,
  gardenStage,
  loadGardenPage,
  moveGarden,
  startGarden,
  undoGarden,
} from '../src/state/gardens';
import { replayReward } from '../src/state/seedRewards';
import { key, pour, won } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';
import { journeyRegions } from '../src/data/ecology';

const garden = collections[0];
const now = new Date('2026-11-17T12:00:00Z');
const openGarden = () => acquireGarden({ ...initial(), seeds: 400 }, garden.id, now);

it('funds every ecosystem wallpaper from guaranteed page rewards, without requiring three stars', () => {
  let save = initial();
  const prices = new Map(
    wallpapers.map((w) => [journeyRegions.find((r) => r.ecosystem === w.ecosystem)!.end, w]),
  );
  for (const page of levels) {
    save = loadLevel(save, page.id);
    for (const [index, step] of page.solution.entries()) {
      if (index === page.solution.length - 1) save = { ...save, moves: page.par * 3 };
      save = move(save, step.from, step.to);
    }
    expect(save.lastSeedReward).toBe(1);
    const wallpaper = prices.get(page.id);
    if (wallpaper) {
      expect(save.seeds).toBeGreaterThanOrEqual(wallpaper.cost);
      const bought = acquireWallpaper(save, wallpaper.id);
      expect(bought.seeds).toBe(save.seeds - wallpaper.cost);
      expect(bought.wallpaper).toBe(wallpaper.id);
      expect(acquireWallpaper(bought, wallpaper.id)).toBe(bought);
      save = bought;
    }
  }
  expect(save.ownedWallpapers).toHaveLength(20);
  // Returning to the first five ecosystems funds the first exclusive garden too.
  expect(save.seeds).toBe(150);
  expect(acquireGarden(save, garden.id, now).seeds).toBe(0);
});

it('rejects locked, unaffordable and unknown purchases and switches owned wallpapers for free', () => {
  const fresh = initial();
  expect(acquireWallpaper(fresh, 'ecosystem-0')).toBe(fresh);
  const rich = { ...fresh, seeds: 1000 };
  expect(acquireWallpaper(rich, 'ecosystem-1')).toBe(rich);
  expect(acquireWallpaper(rich, 'fake')).toBe(rich);
  const first = acquireWallpaper(rich, 'ecosystem-0');
  const normal = acquireWallpaper(first, 'default');
  expect(normal.seeds).toBe(first.seeds);
  expect(acquireWallpaper(normal, 'ecosystem-0').seeds).toBe(first.seeds);
  expect(restore(JSON.stringify(first))).toEqual(first);
});

it('preserves collection seeds through free hints and certified remixes', () => {
  const save = { ...initial(), seeds: 23 };
  expect(purchaseHint(save, levels[0].solution[0]).seeds).toBe(23);
  expect(remixPage(save, () => 0.3).seeds).toBe(23);
});

it('bounds repeat rewards and never grants the three-star bonus twice', () => {
  let save = initial();
  for (let attempt = 0; attempt < 8; attempt++) {
    save = loadLevel(save, 1);
    for (const step of levels[0].solution) save = move(save, step.from, step.to);
  }
  expect(save.seeds).toBe(5); // 1 completion + 1 first-three-star + 3 daily replays.
  expect(save.pigments).toHaveLength(1);
  expect(reward(save)).toBe(save);
  const capped = { ...save, replayRewards: { day: '2026-11-17', count: 3 } };
  expect(replayReward(capped, '2026-11-17T23:00:00Z').earned).toBe(0);
  expect(replayReward(capped, '2026-11-16T23:00:00Z').earned).toBe(0);
  expect(replayReward(capped, '2026-11-18T00:00:00Z')).toEqual({
    earned: 1,
    replayRewards: { day: '2026-11-18', count: 1 },
  });
});

it('credits past campaign completions and retired papers once, without changing a live attempt', () => {
  let save = initial();
  for (const page of levels.slice(0, 6)) {
    save = loadLevel(save, page.id);
    for (const step of page.solution) save = move(save, step.from, step.to);
  }
  save = loadLevel(save, 7);
  save = move(save, levels[6].solution[0].from, levels[6].solution[0].to);
  const legacy = { ...save, seeds: 49, owned: ['ivoire', 'sauge'], theme: 'sauge' };
  delete legacy.economyVersion;
  delete legacy.wallpaper;
  delete legacy.ownedWallpapers;
  delete legacy.gardens;
  const migrated = restore(JSON.stringify(legacy));
  expect(migrated.seeds).toBe(49 + 6 + 100);
  expect(migrated.board).toEqual(save.board);
  expect(migrated.history).toEqual(save.history);
  expect(migrated.pigments).toEqual(save.pigments);
  expect(migrated.current).toBe(7);
  expect(migrated.theme).toBe('sauge');
  expect(restore(JSON.stringify(migrated))).toEqual(migrated);
});

it('includes only the first orchid and charges each additional species at most once', () => {
  const opened = openGarden();
  expect(opened.seeds).toBe(250);
  expect(opened.gardens![garden.id].species).toEqual(['aurore']);
  expect(acquireGarden(opened, garden.id, now)).toBe(opened);
  const next = acquireGardenSpecies(opened, garden.id, 'velours');
  expect(next.seeds).toBe(205);
  expect(acquireGardenSpecies(next, garden.id, 'velours')).toBe(next);
  expect(startGarden(opened, garden.id, 'velours')).toBe(opened);
  expect(acquireGardenSpecies(initial(), garden.id, 'velours').gardens).toEqual({});
  const poor = { ...opened, seeds: 44 };
  expect(acquireGardenSpecies(poor, garden.id, 'velours')).toBe(poor);
});

it('keeps acquired gardens completable when a future collection replaces the featured one', () => {
  const owned = openGarden();
  collections.push({ ...garden, id: 'future-test', availableFrom: '2027-01-01' });
  try {
    expect(featuredCollection(new Date('2027-01-17')).id).toBe('future-test');
    expect(acquireGardenSpecies(owned, garden.id, 'jade').gardens![garden.id].species).toContain(
      'jade',
    );
    expect(
      acquireGarden({ ...initial(), seeds: 500 }, garden.id, new Date('2027-01-17')).gardens,
    ).toEqual({});
  } finally {
    collections.pop();
  }
});

it('ships thirty distinct new garden puzzles with complete independently checked minimum certificates', () => {
  const seen = new Set(levels.map((p) => key(p.board)));
  for (const flower of garden.species)
    for (let page = 0; page < 5; page++) {
      const puzzle = gardenPuzzle(garden.id, flower.id, page);
      expect(seen.has(key(puzzle.board))).toBe(false);
      seen.add(key(puzzle.board));
      let board = puzzle.board;
      for (const step of puzzle.solution) {
        const next = pour(board, step.from, step.to);
        expect(next).not.toBeNull();
        board = next!;
      }
      expect(won(board)).toBe(true);
      expect(solveOptimal(puzzle.board, { maxMoves: puzzle.par, maxNodes: 400000 })?.minimum).toBe(
        puzzle.par,
      );
    }
});

it('resumes orchid puzzles, supports undo and rewards without touching the main campaign', () => {
  let save = startGarden(openGarden(), garden.id, 'aurore');
  const campaign = {
    current: save.current,
    board: save.board,
    history: save.history,
    completed: save.completed,
    pigments: save.pigments,
  };
  for (let page = 0; page < 5; page++) {
    save = loadGardenPage(save, garden.id, 'aurore', page);
    const puzzle = gardenPuzzle(garden.id, 'aurore', page);
    const first = puzzle.solution[0];
    const advanced = moveGarden(save, first.from, first.to);
    expect(undoGarden(advanced).gardenSession!.board).toEqual(save.gardenSession!.board);
    expect(restore(JSON.stringify(advanced))).toEqual(advanced);
    for (const step of puzzle.solution) save = moveGarden(save, step.from, step.to);
    expect(save.gardenSession!.rewarded).toBe(true);
    expect(save.gardenSession!.seedReward).toBe(2);
    expect(moveGarden(save, first.from, first.to)).toBe(save);
    expect(restore(JSON.stringify(save))).toEqual(save);
  }
  expect(gardenStage(save, garden.id, 'aurore')).toBe(5);
  expect({
    current: save.current,
    board: save.board,
    history: save.history,
    completed: save.completed,
    pigments: save.pigments,
  }).toEqual(campaign);
});

it('rejects corrupt ownership, impossible garden boards and skipped premium pages', () => {
  const owned = openGarden();
  expect(loadGardenPage(owned, garden.id, 'aurore', 2)).toBe(owned);
  expect(() => restore(JSON.stringify({ ...owned, wallpaper: 'ecosystem-0' }))).toThrow('Décor');
  expect(() => restore(JSON.stringify({ ...owned, ownedWallpapers: ['unknown'] }))).toThrow(
    'Décors',
  );
  const session = startGarden(owned, garden.id, 'aurore');
  expect(() =>
    restore(
      JSON.stringify({ ...session, gardenSession: { ...session.gardenSession, board: [[1], []] } }),
    ),
  ).toThrow('Fioles');
  expect(() =>
    restore(
      JSON.stringify({
        ...owned,
        gardens: {
          [garden.id]: {
            species: ['aurore'],
            completed: { 'aurore:3': { stars: 3, date: now.toISOString() } },
          },
        },
      }),
    ),
  ).toThrow('discontinue');
  expect(
    acquireGarden(
      { ...initial(), seeds: 1000, testSession: { returnSave: initial() } },
      garden.id,
      now,
    ).gardens,
  ).toEqual({});
});
