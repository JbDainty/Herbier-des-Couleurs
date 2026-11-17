import { expect, it } from 'vitest';
import {
  collections,
  collectionById,
  featuredCollection,
  GOLDEN_COLLECTION_ID,
} from '../src/data/collections';
import campaign from '../src/data/campaign';
import { initial, restore, type Save } from '../src/state/model';
import { acquireGarden, acquireGardenSpecies, wallpapers } from '../src/state/economy';
import { gardenPuzzle, loadGardenPage, moveGarden, startGarden } from '../src/state/gardens';
import { key, pour, won } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';

const golden = collectionById(GOLDEN_COLLECTION_ID)!;
it('adds five independently priced permanent wonders without replacing the seasonal garden', () => {
  expect(golden.species).toHaveLength(5);
  expect(golden.cost).toBe(0);
  expect(golden.species.every((s) => s.cost === 200)).toBe(true);
  expect(featuredCollection(new Date('2026-11-17')).id).toBe('orchidees-lumiere');
  expect(featuredCollection(new Date('2027-03-15')).id).toBe('orchidees-lumiere');
  expect(
    wallpapers.reduce((sum, w) => sum + w.cost, 0) +
      collections.reduce((sum, c) => sum + c.cost + c.species.reduce((n, s) => n + s.cost, 0), 0),
  ).toBe(2225);
});
it('charges exactly 200 in any species order, without an entry fee or a free first species', () => {
  const fresh = { ...initial(), seeds: 1000 };
  expect(acquireGarden(fresh, golden.id)).toBe(fresh);
  let save = acquireGardenSpecies(fresh, golden.id, 'temps');
  expect(save.seeds).toBe(800);
  expect(save.gardens![golden.id].species).toEqual(['temps']);
  expect(restore(JSON.stringify(save))).toEqual(save);
  expect(acquireGardenSpecies(save, golden.id, 'temps')).toBe(save);
  expect(startGarden(save, golden.id, 'phenix')).toBe(save);
  for (const species of golden.species.slice(0, 4))
    save = acquireGardenSpecies(save, golden.id, species.id);
  expect(save.seeds).toBe(0);
  expect(save.gardens![golden.id].species).toHaveLength(5);
  expect(restore(JSON.stringify(save))).toEqual(save);
  expect(acquireGardenSpecies({ ...initial(), seeds: 199 }, golden.id, 'cristal').gardens).toEqual(
    {},
  );
  expect(acquireGardenSpecies(fresh, golden.id, 'unknown')).toBe(fresh);
  const testSession = { ...fresh, testSession: { returnSave: initial() } };
  expect(acquireGardenSpecies(testSession, golden.id, 'phenix')).toBe(testSession);
});
it('keeps golden pages separate from campaign and orchid progress, with no seed reward', () => {
  let save: Save = acquireGardenSpecies({ ...initial(), seeds: 400 }, golden.id, 'temps');
  const campaign = {
    current: save.current,
    board: save.board,
    history: save.history,
    completed: save.completed,
    pigments: save.pigments,
    seeds: save.seeds,
  };
  for (let page = 0; page < 5; page++) {
    save = loadGardenPage(save, golden.id, 'temps', page);
    const puzzle = gardenPuzzle(golden.id, 'temps', page);
    for (const step of puzzle.solution) {
      save = moveGarden(save, step.from, step.to);
      save = restore(JSON.stringify(save));
    }
    expect(save.gardenSession!.seedReward).toBe(0);
    expect(save.gardens![golden.id].completed[`temps:${page}`].stars).toBe(3);
  }
  expect({
    current: save.current,
    board: save.board,
    history: save.history,
    completed: save.completed,
    pigments: save.pigments,
    seeds: save.seeds,
  }).toEqual(campaign);
  expect(save.gardens!['orchidees-lumiere']).toBeUndefined();
});
it('ships 25 unique golden puzzles with minimum certificates, preserving all existing puzzles', () => {
  const seen = new Set(campaign.map((p) => key(p.board)));
  for (const species of collections[0].species)
    for (let i = 0; i < 5; i++) seen.add(key(gardenPuzzle(collections[0].id, species.id, i).board));
  for (const species of golden.species)
    for (let page = 0; page < 5; page++) {
      const puzzle = gardenPuzzle(golden.id, species.id, page);
      expect(seen.has(key(puzzle.board))).toBe(false);
      seen.add(key(puzzle.board));
      let board = puzzle.board;
      for (const step of puzzle.solution) board = pour(board, step.from, step.to)!;
      expect(won(board)).toBe(true);
      expect(solveOptimal(puzzle.board, { maxMoves: puzzle.par, maxNodes: 400000 })?.minimum).toBe(
        puzzle.par,
      );
    }
});
