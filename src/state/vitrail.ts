import type { Save } from './model';
import { vitrailDayKey, vitrailForDay, vitrailDays } from '../data/vitrails';
import {
  rotationPeriod,
  traceVitrail,
  opticalMechanics,
  type OpticalMechanic,
  type VitrailPuzzle,
} from '../engine/vitrail';

export type VitrailSession = {
  day: string;
  level: number;
  replay?: true;
  rotations: number[];
  history: number[][];
  moves: number;
};
type SavedBoard = { rotations: number[]; moves: number; undo: number[] };
type DayProgress = { completed: number; rewarded: boolean; boards?: Record<number, SavedBoard> };
export type VitrailProgress = {
  version: 1;
  days: Record<string, DayProgress>;
  seen: OpticalMechanic[];
  session?: VitrailSession;
};
const freshProgress = (): VitrailProgress => ({ version: 1, days: {}, seen: [] });
export const activeVitrail = (session: VitrailSession) =>
  vitrailForDay(session.day)?.puzzles[session.level];

// Store one cell index per undo step when a board leaves the screen.
function packBoard(session: VitrailSession): SavedBoard {
  const undo = session.history.map((before, i) => {
    const after = session.history[i + 1] ?? session.rotations;
    return before.findIndex((rotation, cell) => rotation !== after[cell]);
  });
  return { rotations: session.rotations, moves: session.moves, undo };
}

function unpackHistory(board: SavedBoard, puzzle: VitrailPuzzle) {
  let after = board.rotations;
  return board.undo
    .slice()
    .reverse()
    .map((cell) => {
      const before = after.slice();
      const period = rotationPeriod(puzzle.cells[cell]);
      before[cell] = (after[cell] + period - 1) % period;
      after = before;
      return before;
    })
    .reverse();
}

/** Archives never grant seeds; future dates and locked stages cannot be opened. */
export function openVitrail(
  save: Save,
  day = vitrailDayKey(),
  level?: number,
  restart = false,
  now = new Date(),
): Save {
  const pack = vitrailForDay(day);
  if (save.testSession || !pack || day > vitrailDayKey(now)) return save;
  const progress = save.vitrail ?? freshProgress();
  const entry = progress.days[day] ?? { completed: 0, rewarded: false };
  const selected = level ?? Math.min(entry.completed, 2);
  if (!Number.isInteger(selected) || selected < 0 || selected > 2 || selected > entry.completed)
    return save;
  const previous = progress.session;
  const lastEntry = previous && progress.days[previous.day];
  // Some old saves reopened a stamped page at its untouched starting position.
  // Keep a real attempt (including an explicit replay) and repair only that empty board.
  const emptyLegacyBoard =
    previous &&
    lastEntry &&
    previous.level < lastEntry.completed &&
    previous.moves === 0 &&
    !previous.replay &&
    !lastEntry.boards?.[previous.level] &&
    activeVitrail(previous)?.initial.every((n, i) => n === previous.rotations[i]);
  if (!restart && previous?.day === day && previous.level === selected && !emptyLegacyBoard)
    return save;
  const days = { ...progress.days, [day]: entry };
  if (previous && !emptyLegacyBoard && (previous.day !== day || previous.level !== selected)) {
    const left = days[previous.day];
    days[previous.day] = {
      ...left,
      boards: { ...left.boards, [previous.level]: packBoard(previous) },
    };
  }
  const puzzle = pack.puzzles[selected];
  const stored = !restart ? entry.boards?.[selected] : undefined;
  // Older editions kept the completion stamp but only one board. Restore a
  // solved arrangement for those stamped pages instead of starting a replay.
  const fallback = !restart && selected < entry.completed ? puzzle.solution : puzzle.initial;
  return {
    ...save,
    vitrail: {
      ...progress,
      days,
      session: {
        day,
        level: selected,
        ...(selected < entry.completed &&
        (restart || (stored && !traceVitrail(puzzle, stored.rotations).solved))
          ? { replay: true as const }
          : {}),
        rotations: stored?.rotations ?? [...fallback],
        history: stored ? unpackHistory(stored, puzzle) : [],
        moves: stored?.moves ?? 0,
      },
    },
  };
}

function settleVitrail(save: Save, now: Date): Save {
  const progress = save.vitrail,
    session = progress?.session;
  if (!progress || !session || save.testSession) return save;
  const puzzle = activeVitrail(session);
  if (!puzzle || !traceVitrail(puzzle, session.rotations).solved) return save;
  const previous = progress.days[session.day];
  const completed = Math.max(previous.completed, session.level + 1);
  const earn = completed === 3 && !previous.rewarded && session.day === vitrailDayKey(now);
  return {
    ...save,
    seeds: save.seeds + (earn ? 1 : 0),
    vitrail: {
      ...progress,
      days: {
        ...progress.days,
        [session.day]: { ...previous, completed, rewarded: previous.rewarded || earn },
      },
    },
  };
}

export function rotateVitrail(save: Save, cell: number, now = new Date()): Save {
  const progress = save.vitrail,
    session = progress?.session;
  if (!progress || !session || save.testSession || session.day > vitrailDayKey(now)) return save;
  const puzzle = activeVitrail(session);
  if (
    !puzzle ||
    !Number.isInteger(cell) ||
    cell < 0 ||
    cell >= puzzle.cells.length ||
    puzzle.cells[cell] === 'glass' ||
    traceVitrail(puzzle, session.rotations).solved
  )
    return save;
  const rotations = [...session.rotations];
  rotations[cell] = (rotations[cell] + 1) % rotationPeriod(puzzle.cells[cell]);
  return settleVitrail(
    {
      ...save,
      vitrail: {
        ...progress,
        session: {
          ...session,
          rotations,
          history: [...session.history.slice(-199), session.rotations],
          moves: session.moves + 1,
        },
      },
    },
    now,
  );
}

export function undoVitrail(save: Save): Save {
  const progress = save.vitrail,
    session = progress?.session;
  if (!progress || !session || !session.history.length || save.testSession) return save;
  return {
    ...save,
    vitrail: {
      ...progress,
      session: {
        ...session,
        rotations: session.history[session.history.length - 1],
        history: session.history.slice(0, -1),
        moves: Math.max(0, session.moves - 1),
      },
    },
  };
}

export function acknowledgeOptics(save: Save, mechanic: OpticalMechanic): Save {
  const progress = save.vitrail;
  if (
    !progress ||
    progress.seen.includes(mechanic) ||
    !['mirror', 'splitter', 'mixer'].includes(mechanic)
  )
    return save;
  return { ...save, vitrail: { ...progress, seen: [...progress.seen, mechanic] } };
}
export function newOpticalLessons(save: Save, puzzle: VitrailPuzzle): OpticalMechanic[] {
  return opticalMechanics(puzzle).filter((kind) => !save.vitrail?.seen.includes(kind));
}

/** Old saves need no migration; optional daily progress has its own stable version. */
export function validateVitrail(save: Save): void {
  const progress = save.vitrail;
  if (progress === undefined) return;
  const invalid = () => {
    throw Error('Le carnet des vitraux est invalide.');
  };
  if (
    !progress ||
    progress.version !== 1 ||
    !progress.days ||
    typeof progress.days !== 'object' ||
    Array.isArray(progress.days) ||
    Object.keys(progress.days).length > vitrailDays.length ||
    !Array.isArray(progress.seen) ||
    !progress.seen.every((id) => ['mirror', 'splitter', 'mixer'].includes(id))
  )
    invalid();
  const validRotations = (values: unknown, puzzle: VitrailPuzzle): values is number[] =>
    Array.isArray(values) &&
    values.length === puzzle.cells.length &&
    values.every((n, i) => Number.isInteger(n) && n >= 0 && n < rotationPeriod(puzzle.cells[i]));
  for (const [day, entry] of Object.entries(progress.days)) {
    if (
      !vitrailForDay(day) ||
      !entry ||
      !Number.isInteger(entry.completed) ||
      entry.completed < 0 ||
      entry.completed > 3 ||
      typeof entry.rewarded !== 'boolean' ||
      (entry.rewarded && entry.completed !== 3)
    )
      invalid();
    if (entry.boards !== undefined) {
      if (!entry.boards || typeof entry.boards !== 'object' || Array.isArray(entry.boards))
        invalid();
      for (const [key, board] of Object.entries(entry.boards)) {
        const level = Number(key);
        const puzzle = vitrailForDay(day)?.puzzles[level];
        if (
          !/^[012]$/.test(key) ||
          level > entry.completed ||
          !puzzle ||
          !board ||
          !validRotations(board.rotations, puzzle) ||
          !Number.isSafeInteger(board.moves) ||
          !Array.isArray(board.undo) ||
          board.undo.length > 200 ||
          board.moves < board.undo.length ||
          !board.undo.every(
            (i: number) =>
              Number.isInteger(i) &&
              i >= 0 &&
              i < puzzle.cells.length &&
              puzzle.cells[i] !== 'glass',
          ) ||
          (level === entry.completed && traceVitrail(puzzle, board.rotations).solved)
        )
          invalid();
      }
    }
  }
  const session = progress.session;
  if (!session) return;
  if (!Number.isInteger(session.level) || session.level < 0 || session.level > 2) invalid();
  const puzzle = activeVitrail(session),
    entry = progress.days[session.day];
  if (!puzzle || !entry || session.level > entry.completed) return invalid();
  const valid = (rotations: unknown): rotations is number[] => validRotations(rotations, puzzle);
  if (
    !valid(session.rotations) ||
    !Array.isArray(session.history) ||
    session.history.length > 200 ||
    !session.history.every(valid) ||
    !Number.isSafeInteger(session.moves) ||
    session.moves < session.history.length ||
    (traceVitrail(puzzle, session.rotations).solved && entry.completed < session.level + 1)
  )
    invalid();
}
