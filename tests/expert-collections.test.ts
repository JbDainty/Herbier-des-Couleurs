import { expect, it } from 'vitest';
import { collections } from '../src/data/collections';
import { initial, restore, type Save } from '../src/state/model';
import { acquireGarden, acquireGardenSpecies } from '../src/state/economy';
import {
  gardenPuzzle,
  loadGardenPage,
  moveGarden,
  undoGarden,
  recoverGarden,
  rememberGardenPath,
  sessionGardenPuzzle,
} from '../src/state/gardens';
import { gardenGuide, validGardenPlan } from '../src/state/gardenGuide';
import { moves, pour, won, type Move } from '../src/engine/puzzle';
import { goalPacking } from '../src/engine/goalPacking';
import { referencePour, referenceWon } from './reference-puzzle';

function owned() {
  let s = { ...initial(), seeds: 3000 };
  for (const c of collections) {
    if (c.kind !== 'golden') s = acquireGarden(s, c.id, new Date('2026-11-17'));
    for (const p of c.species) s = acquireGardenSpecies(s, c.id, p.id);
  }
  return s;
}
const first = () => loadGardenPage(owned(), 'orchidees-lumiere', 'aurore', 0);
const trapped = () => {
  let s = first();
  for (const m of [
    ...sessionGardenPuzzle(s.gardenSession!).solution.slice(0, 3),
    { from: 7, to: 5 },
  ])
    s = moveGarden(s, m.from, m.to);
  return s;
};

it('all 55 expert puzzles mix three mechanics and admit two independent shortest winning orders', () => {
  const mechanics = new Set<string>();
  let count = 0;
  for (const c of collections)
    for (const p of c.species)
      for (let page = 0; page < 5; page++) {
        const puzzle = gardenPuzzle(c.id, p.id, page);
        expect(puzzle.par).toBeGreaterThanOrEqual([14, 15, 16, 16, 18][page]);
        expect(new Set(puzzle.board.flat()).size).toBeGreaterThanOrEqual(5);
        expect(puzzle.rules!.mechanics).toHaveLength(3);
        puzzle.rules!.mechanics.forEach((m) => mechanics.add(m));
        const other = puzzle.alternatives![0];
        expect(other).not.toEqual(puzzle.solution);
        for (const path of [puzzle.solution, other]) {
          expect(path).toHaveLength(puzzle.par);
          let board = puzzle.board;
          const seen = new Set<string>();
          for (const m of path) {
            expect(seen.has(JSON.stringify(board))).toBe(false);
            seen.add(JSON.stringify(board));
            const next = referencePour(board, m.from, m.to, puzzle.rules);
            expect(next).not.toBeNull();
            board = next!;
          }
          expect(referenceWon(board, puzzle.rules)).toBe(true);
        }
        count++;
      }
  expect(count).toBe(55);
  expect(mechanics.size).toBe(8);
});

it('recovers a genuine irreversible dead end by undoing only the last wrong choice', () => {
  const s = trapped(),
    session = s.gardenSession!,
    puzzle = sessionGardenPuzzle(session);
  expect(session.moves).toBe(4);
  expect(goalPacking(puzzle.board, puzzle.rules)(session.board).possible).toBe(false);
  const recovered = recoverGarden(restore(JSON.stringify(s)));
  expect(recovered.gardenSession!.moves).toBe(3);
  expect(recovered.gardenSession!.history).toHaveLength(3);
  let solved = recovered;
  for (const m of recovered.gardenSession!.guide!.path) solved = moveGarden(solved, m.from, m.to);
  expect(solved.gardenSession!.rewarded).toBe(true);
  expect(solved.seeds).toBe(s.seeds);
  expect(solved.gardens!['orchidees-lumiere'].species).toEqual(
    s.gardens!['orchidees-lumiere'].species,
  );
});

it('retains a certified way home after thousands of legal choices, undo operations and reloads', () => {
  let seed = 0x7265636f;
  const rnd = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  let s = owned(),
    samples = 0;
  for (const c of collections)
    for (const p of c.species)
      for (let page = 0; page < 5; page++) {
        for (let trial = 0; trial < 3; trial++) {
          s = loadGardenPage(s, c.id, p.id, page);
          const puzzle = sessionGardenPuzzle(s.gardenSession!),
            balance = s.seeds;
          for (let i = 0; i < 24 && !s.gardenSession!.rewarded; i++) {
            const choices = moves(s.gardenSession!.board, puzzle.rules);
            if (!choices.length) break;
            const m = choices[rnd(choices.length)];
            s = moveGarden(s, m.from, m.to);
            if (i % 7 === 6) s = undoGarden(s);
            s = restore(JSON.stringify(s));
            samples++;
            const guide = gardenGuide(s.gardenSession!, puzzle);
            const board =
              guide.at === s.gardenSession!.moves
                ? s.gardenSession!.board
                : s.gardenSession!.history[guide.at];
            expect(validGardenPlan(board, guide.path, puzzle)).toBe(true);
          }
          if (!s.gardenSession!.rewarded) {
            s = recoverGarden(s);
            for (const m of s.gardenSession!.guide!.path) s = moveGarden(s, m.from, m.to);
          }
          expect(s.gardenSession!.rewarded).toBe(true);
          expect(s.seeds).toBe(balance);
        }
      }
  expect(samples).toBeGreaterThan(2500);
});

it('resumes an already saved classic puzzle unchanged, then opens the next page in expert mode', () => {
  let s = loadGardenPage(owned(), 'orchidees-lumiere', 'aurore', 0, 1);
  const puzzle = sessionGardenPuzzle(s.gardenSession!),
    [m, ...rest] = puzzle.solution;
  s = moveGarden(s, m.from, m.to);
  const legacy = { ...s.gardenSession! };
  delete legacy.puzzleVersion;
  delete legacy.known;
  delete legacy.historyKnown;
  delete legacy.guide;
  s = restore(JSON.stringify({ ...s, gardenSession: legacy }));
  expect(sessionGardenPuzzle(s.gardenSession!).board).toEqual(puzzle.board);
  expect(sessionGardenPuzzle(s.gardenSession!).rules).toBeUndefined();
  for (const move of rest) s = moveGarden(s, move.from, move.to);
  expect(s.gardenSession!.rewarded).toBe(true);
  const balance = s.seeds;
  s = loadGardenPage(s, 'orchidees-lumiere', 'aurore', 1);
  expect(s.gardenSession!.puzzleVersion).toBe(2);
  expect(sessionGardenPuzzle(s.gardenSession!).rules!.mechanics).toHaveLength(3);
  expect(s.seeds).toBe(balance);
});

it('persists a solved continuation but rejects stale or invalid hint plans', () => {
  const s = first(),
    puzzle = sessionGardenPuzzle(s.gardenSession!);
  expect(rememberGardenPath(s, s.gardenSession!.board, [])).toBe(s);
  expect(rememberGardenPath(s, [[]], puzzle.solution)).toBe(s);
  let continued = rememberGardenPath(s, s.gardenSession!.board, puzzle.alternatives![0]);
  continued = restore(JSON.stringify(continued));
  const path = continued.gardenSession!.guide!.path;
  for (let i = 0; i < path.length; i++) {
    expect(continued.gardenSession!.guide!.path.length).toBe(path.length - i);
    continued = moveGarden(continued, path[i].from, path[i].to);
  }
  expect(continued.gardenSession!.rewarded).toBe(true);
  expect(recoverGarden(continued)).toBe(continued);
  // A continuation found away from the two offline paths must also be consumed,
  // rather than sending the player back to the same hint after each transfer.
  let detour = first();
  for (const m of puzzle.solution.slice(0, 10)) detour = moveGarden(detour, m.from, m.to);
  const custom = [{ from: 1, to: 3 }, { from: 3, to: 1 }, ...puzzle.solution.slice(10)];
  detour = rememberGardenPath(detour, detour.gardenSession!.board, custom);
  for (let i = 0; i < custom.length; i++) {
    expect(detour.gardenSession!.guide!.at).toBe(detour.gardenSession!.moves);
    expect(detour.gardenSession!.guide!.path).toEqual(custom.slice(i));
    detour = moveGarden(detour, custom[i].from, custom[i].to);
    detour = restore(JSON.stringify(detour));
  }
  expect(detour.gardenSession!.rewarded).toBe(true);
});

it('keeps mystery information aligned with pours, undo and saved histories', () => {
  const s = first(),
    session = s.gardenSession!;
  expect(session.known!.flat().some((v) => !v)).toBe(true);
  const m = sessionGardenPuzzle(session).solution[0];
  const next = restore(JSON.stringify(moveGarden(s, m.from, m.to)));
  expect(next.gardenSession!.known![m.to].every(Boolean)).toBe(true);
  const undone = undoGarden(next);
  expect(undone.gardenSession!.board).toEqual(session.board);
  expect(undone.gardenSession!.known).toEqual(session.known);
  expect(restore(JSON.stringify(undone))).toEqual(undone);
});

it('rejects corrupted puzzle versions and unproved recovery witnesses', () => {
  const s = first(),
    session = s.gardenSession!;
  expect(() =>
    restore(JSON.stringify({ ...s, gardenSession: { ...session, puzzleVersion: 99 } })),
  ).toThrow('Session');
  expect(() =>
    restore(JSON.stringify({ ...s, gardenSession: { ...session, guide: { at: 999, path: [] } } })),
  ).toThrow('Chemin');
  expect(() =>
    restore(
      JSON.stringify({
        ...s,
        gardenSession: { ...session, guide: { at: 0, path: [{ from: 0, to: 0 }] } },
      }),
    ),
  ).toThrow('Chemin');
});
