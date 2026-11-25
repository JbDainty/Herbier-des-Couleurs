import { expect, it } from 'vitest';
import levels from '../src/data/campaign';
import { collections, featuredCollection } from '../src/data/collections';
import {
  acquireGarden,
  acquireGardenSpecies,
  acquireWallpaper,
  shopWallpapers,
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
import { key, pour, won } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';
import { journeyRegions } from '../src/data/ecology';

const garden = collections[0];
const now = new Date('2026-11-17T12:00:00Z');
const openGarden = () => acquireGarden({ ...initial(), seeds: 400 }, garden.id, now);

it('caps campaign income at 1000 seeds, funding all wallpapers and the garden with three stars', () => {
  let save = initial();
  const prices = new Map(
    wallpapers.map((w) => [journeyRegions.find((r) => r.ecosystem === w.ecosystem)!.end, w]),
  );
  for (const page of levels) {
    save = loadLevel(save, page.id);
    for (const step of page.solution) {
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

it('shows owned and affordable landscapes plus only the next undiscovered ecosystem', () => {
  const fresh = initial();
  expect(shopWallpapers(fresh)).toEqual({ available: [], upcoming: wallpapers[1] });
  const rich = { ...fresh, seeds: wallpapers[0].cost };
  expect(shopWallpapers(rich)).toEqual({ available: [wallpapers[0]], upcoming: wallpapers[1] });
  const bought = acquireWallpaper(rich, wallpapers[0].id);
  expect(shopWallpapers(acquireWallpaper(bought, 'default'))).toEqual(shopWallpapers(rich));
  const completed = Object.fromEntries(
    wallpapers.slice(1).map((w) => [w.firstPage - 1, { stars: 3, date: '2026-11-25' }]),
  );
  const all = { ...fresh, completed, seeds: 20, ownedWallpapers: [wallpapers[19].id] };
  expect(shopWallpapers(all)).toEqual({
    available: wallpapers.filter((w) => w.cost <= 20 || w.id === wallpapers[19].id),
    upcoming: undefined,
  });
  expect(shopWallpapers({ ...all, seeds: 0 }).available).toEqual([wallpapers[19]]);
});

it('preserves collection seeds through free hints and certified remixes', () => {
  const save = { ...initial(), seeds: 23 };
  expect(purchaseHint(save, levels[0].solution[0]).seeds).toBe(23);
  expect(remixPage(save, () => 0.3).seeds).toBe(23);
});

it('never rewards repeated clears, even on a later day or with an old replay ledger', () => {
  let save = initial();
  for (let attempt = 0; attempt < 8; attempt++) {
    save = loadLevel(save, 1);
    for (const step of levels[0].solution) save = move(save, step.from, step.to);
  }
  expect(save.seeds).toBe(1); // Only the first three stars, with no replay income.
  expect(save.pigments).toHaveLength(1);
  expect(reward(save)).toBe(save);
  const legacyLedger = { ...save, replayRewards: { day: '2026-11-17', count: 0 } };
  const replay = { ...legacyLedger, attemptRewarded: false };
  const later = reward(replay, '2026-11-18T12:00:00Z');
  expect(later.seeds).toBe(1);
  expect(later.lastSeedReward).toBe(0);
  expect(later.replayRewards).toEqual(legacyLedger.replayRewards);
  expect(restore(JSON.stringify(later))).toEqual(later);
});

it('never grants seeds for seasonal first clears or three-star upgrades and replays', () => {
  let save = loadGardenPage(openGarden(), garden.id, 'aurore', 0, 1);
  const puzzle = gardenPuzzle(garden.id, 'aurore', 0, 1);
  for (const step of puzzle.solution.slice(0, -1)) save = moveGarden(save, step.from, step.to);
  // Move a completed tube to an empty tube and back: real extra moves before the final pour.
  const from = save.gardenSession!.board.findIndex(
    (tube) => tube.length === 4 && tube.every((color) => color === tube[0]),
  );
  const empty = save.gardenSession!.board.findIndex((tube) => !tube.length);
  expect(from).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < puzzle.par; i++) {
    save = moveGarden(save, from, empty);
    save = moveGarden(save, empty, from);
  }
  const last = puzzle.solution.at(-1)!;
  save = moveGarden(save, last.from, last.to);
  expect(save.gardens![garden.id].completed['aurore:0'].stars).toBe(1);
  expect(save.gardenSession!.seedReward).toBe(0);
  const firstBalance = save.seeds;
  const firstDate = save.gardens![garden.id].completed['aurore:0'].date;
  for (let attempt = 0; attempt < 3; attempt++) {
    save = loadGardenPage(restore(JSON.stringify(save)), garden.id, 'aurore', 0, 1);
    for (const step of puzzle.solution) save = moveGarden(save, step.from, step.to);
    expect(save.gardenSession!.seedReward).toBe(0);
    expect(save.seeds).toBe(firstBalance);
    expect(save.gardens![garden.id].completed['aurore:0']).toEqual({ stars: 3, date: firstDate });
  }
});

it('only refunds retired papers once, without crediting past pages or changing a live attempt', () => {
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
  expect(migrated.seeds).toBe(49 + 100);
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
        const next = pour(board, step.from, step.to, puzzle.rules);
        expect(next).not.toBeNull();
        board = next!;
      }
      expect(won(board, puzzle.rules)).toBe(true);
      expect(
        solveOptimal(puzzle.board, { rules: puzzle.rules, maxMoves: puzzle.par, maxNodes: 5000000 })
          ?.minimum,
      ).toBe(puzzle.par);
    }
});

it('resumes orchid puzzles and records progress without changing seeds or the main campaign', () => {
  let save = startGarden(openGarden(), garden.id, 'aurore');
  const campaign = {
    current: save.current,
    board: save.board,
    history: save.history,
    completed: save.completed,
    pigments: save.pigments,
    seeds: save.seeds,
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
    expect(save.gardenSession!.seedReward).toBe(0);
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
    seeds: save.seeds,
  }).toEqual(campaign);
});

it('all thirty seasonal pages preserve the wallet, including first three-star completions', () => {
  let save = openGarden();
  for (const flower of garden.species) {
    save = acquireGardenSpecies(save, garden.id, flower.id);
    const balance = save.seeds;
    for (let page = 0; page < 5; page++) {
      save = loadGardenPage(save, garden.id, flower.id, page);
      for (const step of gardenPuzzle(garden.id, flower.id, page).solution)
        save = moveGarden(save, step.from, step.to);
      expect(save.gardens![garden.id].completed[`${flower.id}:${page}`].stars).toBe(3);
      expect(save.gardenSession!.seedReward).toBe(0);
      expect(save.seeds).toBe(balance);
      save = restore(JSON.stringify(save));
      expect(save.seeds).toBe(balance);
    }
  }
  expect(Object.keys(save.gardens![garden.id].completed)).toHaveLength(30);
  expect(save.seeds).toBe(25); // 400 initial fixture - 150 garden - 225 extra species.
});

it('preserves already credited seeds and a winning garden session from the previous rules', () => {
  let save = startGarden(openGarden(), garden.id, 'aurore');
  for (const step of gardenPuzzle(garden.id, 'aurore', 0).solution)
    save = moveGarden(save, step.from, step.to);
  const previous = {
    ...save,
    seeds: 275,
    lastSeedReward: 2,
    gardenSession: { ...save.gardenSession!, seedReward: 2 },
  };
  const restored = restore(JSON.stringify(previous));
  expect(restored).toEqual(previous);
  save = loadGardenPage(restored, garden.id, 'aurore', 1);
  for (const step of gardenPuzzle(garden.id, 'aurore', 1).solution)
    save = moveGarden(save, step.from, step.to);
  expect(save.seeds).toBe(275);
  expect(save.gardenSession!.seedReward).toBe(0);
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
