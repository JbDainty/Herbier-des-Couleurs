import { expect, it } from 'vitest';
import { initial, restore } from '../src/state/model';
import {
  activeVitrail,
  acknowledgeOptics,
  newOpticalLessons,
  openVitrail,
  rotateVitrail,
  undoVitrail,
} from '../src/state/vitrail';
import { vitrailDayKey, vitrailDays, vitrailForDay, vitrailRange } from '../src/data/vitrails';
import {
  canonicalVitrail,
  opticalMechanics,
  outgoing,
  rotationPeriod,
  traceVitrail,
  vitrailHint,
  type VitrailPuzzle,
} from '../src/engine/vitrail';

const today = new Date('2026-11-18T12:00:00Z');
const tomorrow = new Date('2026-11-19T12:00:00Z');
const open = (s = initial(), day = '2026-11-18', level?: number, restart = false, now = today) =>
  openVitrail(s, day, level, restart, now);
function finish(save: ReturnType<typeof initial>, now = today) {
  for (let limit = 0; limit < 150; limit++) {
    const session = save.vitrail!.session!,
      puzzle = activeVitrail(session)!;
    if (traceVitrail(puzzle, session.rotations).solved) return save;
    const cell = vitrailHint(puzzle, session.rotations);
    expect(cell).not.toBeNull();
    save = rotateVitrail(save, cell!, now);
  }
  throw Error('Hint did not converge');
}
it('bundles 365 continuous UTC days with three distinct progressively richer puzzles each', () => {
  expect(vitrailDays).toHaveLength(365);
  expect(vitrailRange).toEqual({ first: '2026-11-18', last: '2027-11-17' });
  for (const [index, pack] of vitrailDays.entries()) {
    expect(pack.day).toBe(new Date(Date.UTC(2026, 10, 18 + index)).toISOString().slice(0, 10));
    expect(pack.puzzles).toHaveLength(3);
    expect(opticalMechanics(pack.puzzles[0])).toEqual(['mirror']);
    expect(opticalMechanics(pack.puzzles[1])).toEqual(['mirror', 'splitter']);
    expect(opticalMechanics(pack.puzzles[2])).toEqual(['mirror', 'splitter', 'mixer']);
    const difficulty = pack.puzzles.map((p) =>
      p.cells.reduce((sum, c) => sum + { glass: 0, mirror: 1, splitter: 3, mixer: 7 }[c], 0),
    );
    expect(difficulty[0]).toBeLessThan(difficulty[1]);
    expect(difficulty[1]).toBeLessThan(difficulty[2]);
  }
});
it('has no repeated topology, including color permutations, scrambles, rotations or reflections', () => {
  const keys = vitrailDays.flatMap((day) => day.puzzles.map(canonicalVitrail));
  expect(new Set(keys).size).toBe(1095);
  const puzzle = vitrailDays[0].puzzles[0];
  expect(canonicalVitrail({ ...puzzle, initial: puzzle.solution })).toBe(canonicalVitrail(puzzle));
  expect(
    canonicalVitrail({
      ...puzzle,
      sources: puzzle.sources.map((p) => ({ ...p, color: 7 })),
      targets: puzzle.targets.map((p) => ({ ...p, color: 7 })),
    }),
  ).toBe(canonicalVitrail(puzzle));
});
it('certifies all 1095 initial boards, boundaries, correct target colors and free paths to victory', () => {
  for (const pack of vitrailDays)
    for (const puzzle of pack.puzzles) {
      expect(puzzle.cells).toHaveLength(puzzle.size * puzzle.size);
      expect(traceVitrail(puzzle, puzzle.initial).solved).toBe(false);
      expect(traceVitrail(puzzle, puzzle.solution).solved).toBe(true);
      for (const port of [...puzzle.sources, ...puzzle.targets]) {
        const x = port.cell % puzzle.size,
          y = Math.floor(port.cell / puzzle.size);
        expect([y === 0, x === puzzle.size - 1, y === puzzle.size - 1, x === 0][port.side]).toBe(
          true,
        );
      }
      const rotations = puzzle.initial.map(
        (value, i) => (value + 1) % rotationPeriod(puzzle.cells[i]),
      );
      for (let limit = 0; !traceVitrail(puzzle, rotations).solved; limit++) {
        expect(limit).toBeLessThan(100);
        const i = vitrailHint(puzzle, rotations)!;
        rotations[i] = (rotations[i] + 1) % rotationPeriod(puzzle.cells[i]);
      }
    }
});
it('models both mirror orientations and one-way splitter and mixer ports', () => {
  for (let d = 0; d < 4; d++) {
    expect(outgoing('glass', 0, d)).toEqual([d]);
    expect(outgoing('mirror', 0, d)).toEqual([d ^ 1]);
    expect(outgoing('mirror', 1, d)).toEqual([d ^ 3]);
    expect(outgoing('splitter', d, d)).toEqual([d, (d + 1) % 4]);
    expect(outgoing('splitter', d, (d + 1) % 4)).toEqual([]);
    expect(outgoing('mixer', d, (d + 2) % 4)).toEqual([]);
  }
});
it('mixes additive light and rejects excess color, while straight crossings keep rays independent', () => {
  const puzzle: VitrailPuzzle = {
    size: 1,
    cells: ['mixer'],
    initial: [0],
    solution: [0],
    sources: [
      { cell: 0, side: 3, color: 1 },
      { cell: 0, side: 2, color: 2 },
    ],
    targets: [{ cell: 0, side: 0, color: 3 }],
  };
  expect(traceVitrail(puzzle, [0]).solved).toBe(true);
  expect(
    traceVitrail({ ...puzzle, sources: [...puzzle.sources, { cell: 0, side: 1, color: 4 }] }, [0])
      .solved,
  ).toBe(false);
  expect(
    traceVitrail(
      {
        ...puzzle,
        cells: ['glass'],
        sources: [
          { cell: 0, side: 3, color: 1 },
          { cell: 0, side: 2, color: 4 },
        ],
        targets: [
          { cell: 0, side: 1, color: 1 },
          { cell: 0, side: 0, color: 4 },
        ],
      },
      [0],
    ).solved,
  ).toBe(true);
});
it('terminates closed beam loops and does not accept a board without targets', () => {
  const loop: VitrailPuzzle = {
    size: 2,
    cells: ['mirror', 'mirror', 'mirror', 'mirror'],
    initial: [0, 1, 1, 0],
    solution: [0, 1, 1, 0],
    sources: [{ cell: 0, side: 2, color: 1 }],
    targets: [],
  };
  const trace = traceVitrail(loop, loop.initial);
  expect(trace.solved).toBe(false);
  expect(trace.incoming.flat().filter(Boolean)).toHaveLength(4);
});
it('opens levels in order and pays only one seed after the third completion, without stars', () => {
  let save = open();
  expect(open(save, '2026-11-18', 2)).toBe(save);
  for (let stage = 0; stage < 3; stage++) {
    save = open(save, '2026-11-18', stage);
    save = finish(save);
    expect(save.vitrail!.days['2026-11-18'].completed).toBe(stage + 1);
    expect(save.seeds).toBe(stage === 2 ? 1 : 0);
  }
  expect(save.vitrail!.days['2026-11-18'].rewarded).toBe(true);
  expect(save.completed).toEqual({});
  expect(JSON.stringify(save.vitrail)).not.toContain('stars');
});
it('never pays again on replay, undo after victory, restart, save reload or a return from another day', () => {
  let save = open();
  for (let stage = 0; stage < 3; stage++) save = finish(open(save, '2026-11-18', stage));
  save = finish(undoVitrail(save));
  expect(save.seeds).toBe(1);
  save = restore(JSON.stringify(save));
  for (let stage = 0; stage < 3; stage++) save = finish(open(save, '2026-11-18', stage, true));
  expect(save.seeds).toBe(1);
  save = open(save, '2026-11-19', 0, false, tomorrow);
  save = finish(open(save, '2026-11-18', 2, true, tomorrow), tomorrow);
  expect(save.seeds).toBe(1);
});
it('resumes exact rotations and history and keeps optical discoveries across days', () => {
  let save = open();
  const i = save.vitrail!.session!.rotations.findIndex(
    (_, i) => activeVitrail(save.vitrail!.session!)!.cells[i] === 'mirror',
  );
  save = rotateVitrail(save, i, today);
  save = acknowledgeOptics(save, 'mirror');
  const restored = restore(JSON.stringify(save));
  expect(restored.vitrail).toEqual(save.vitrail);
  expect(open(restored)).toBe(restored);
  expect(newOpticalLessons(restored, activeVitrail(restored.vitrail!.session!)!)).toEqual([]);
  expect(newOpticalLessons(restored, vitrailDays[0].puzzles[2])).toEqual(['splitter', 'mixer']);
  expect(open(restored, '2026-11-19', 0, false, tomorrow).vitrail!.seen).toEqual(['mirror']);
});
it('gives no seeds for archives or for a previous day finished after midnight', () => {
  let save = open(initial(), '2026-11-18', 0, false, tomorrow);
  for (let stage = 0; stage < 3; stage++)
    save = finish(open(save, '2026-11-18', stage, false, tomorrow), tomorrow);
  expect(save.seeds).toBe(0);
  expect(save.vitrail!.days['2026-11-18']).toMatchObject({ completed: 3, rewarded: false });
  for (let stage = 0; stage < 3; stage++)
    save = finish(open(save, '2026-11-19', stage, false, tomorrow), tomorrow);
  expect(save.seeds).toBe(1);
});
it('selects the same date for all time zones and never recycles the year after its last day', () => {
  expect(vitrailDayKey(new Date('2026-11-19T01:00:00+01:00'))).toBe('2026-11-19');
  expect(vitrailDayKey(new Date('2026-11-18T19:00:00-05:00'))).toBe('2026-11-19');
  expect(vitrailForDay('2027-11-18')).toBeUndefined();
  const save = initial();
  expect(open(save, '2026-11-19')).toBe(save);
  expect(open(save, '2027-11-18', 0, false, new Date('2027-11-18T12:00:00Z'))).toBe(save);
});
it('preserves campaign, wallet, collections and existing saves and isolates preview sessions', () => {
  const original = { ...initial(), started: true, seeds: 150 };
  const save = open(original);
  const { vitrail, ...unchanged } = save;
  expect(unchanged).toEqual(original);
  expect(restore(JSON.stringify(original)).vitrail).toBeUndefined();
  const preview = { ...original, testSession: { returnSave: original } };
  expect(open(preview)).toBe(preview);
});
it('rejects corrupt progress, impossible rotations, unlocked future stages and false reward ledgers', () => {
  const save = open();
  for (const mutate of [
    (s: typeof save) => {
      s.vitrail!.session!.rotations[0] = 9;
    },
    (s: typeof save) => {
      s.vitrail!.session!.level = 2;
    },
    (s: typeof save) => {
      s.vitrail!.days['2026-11-18'].rewarded = true;
    },
    (s: typeof save) => {
      s.vitrail!.seen = ['unknown' as never];
    },
  ]) {
    const copy = structuredClone(save);
    mutate(copy);
    expect(() => restore(JSON.stringify(copy))).toThrow();
  }
});

it('restores a stamped layout and a partial attempt including undo after visiting other days', () => {
  const day = '2026-11-18';
  const first = finish(open());
  const solved = first.vitrail!.session!;
  let save = open(first, day, 1);
  const step = vitrailHint(
    activeVitrail(save.vitrail!.session!)!,
    save.vitrail!.session!.rotations,
  )!;
  save = rotateVitrail(save, step, today);
  const partial = save.vitrail!.session!;
  save = open(save, '2026-11-19', 0, false, tomorrow);
  save = restore(JSON.stringify(save));
  expect(open(save, day, 0, false, tomorrow).vitrail!.session).toEqual(solved);
  const resumed = open(save, day, undefined, false, tomorrow);
  expect(resumed.vitrail!.session).toEqual(partial);
  expect(undoVitrail(resumed).vitrail!.session!.rotations).toEqual(partial.history.at(-1));
});

it('opens a completed legacy day already solved and only resets a board on explicit replay', () => {
  const day = '2026-11-18';
  let save = open();
  save = {
    ...save,
    vitrail: { version: 1, seen: [], days: { [day]: { completed: 3, rewarded: true } } },
  };
  save = open(restore(JSON.stringify(save)), day);
  const current = save.vitrail!.session!;
  expect(traceVitrail(activeVitrail(current)!, current.rotations).solved).toBe(true);
  const replay = open(save, day, 0, true);
  expect(replay.vitrail!.session!.rotations).toEqual(vitrailForDay(day)!.puzzles[0].initial);
  expect(finish(replay).seeds).toBe(save.seeds);
});

it('repairs the untouched last grid in an older stamped trio and keeps an explicitly restarted grid', () => {
  const day = '2026-11-18';
  const save = open();
  const legacy = {
    ...save,
    vitrail: {
      ...save.vitrail!,
      days: { [day]: { completed: 3, rewarded: true } },
      session: {
        day,
        level: 2,
        moves: 0,
        history: [],
        rotations: vitrailForDay(day)!.puzzles[2].initial,
      },
    },
  };
  const repaired = open(restore(JSON.stringify(legacy)));
  const current = repaired.vitrail!.session!;
  expect(traceVitrail(activeVitrail(current)!, current.rotations).solved).toBe(true);
  const replay = open(repaired, day, 2, true);
  const resumed = open(restore(JSON.stringify(replay)));
  expect(resumed.vitrail!.session).toEqual(replay.vitrail!.session);
});
