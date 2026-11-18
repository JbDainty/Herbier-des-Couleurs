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
  rotations: number[];
  history: number[][];
  moves: number;
};
export type VitrailProgress = {
  version: 1;
  days: Record<string, { completed: number; rewarded: boolean }>;
  seen: OpticalMechanic[];
  session?: VitrailSession;
};
const freshProgress = (): VitrailProgress => ({ version: 1, days: {}, seen: [] });
export const activeVitrail = (session: VitrailSession) =>
  vitrailForDay(session.day)?.puzzles[session.level];

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
  if (!restart && progress.session?.day === day && progress.session.level === selected) return save;
  return {
    ...save,
    vitrail: {
      ...progress,
      days: { ...progress.days, [day]: entry },
      session: {
        day,
        level: selected,
        rotations: [...pack.puzzles[selected].initial],
        history: [],
        moves: 0,
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
      days: { ...progress.days, [session.day]: { completed, rewarded: previous.rewarded || earn } },
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
  }
  const session = progress.session;
  if (!session) return;
  if (!Number.isInteger(session.level) || session.level < 0 || session.level > 2) invalid();
  const puzzle = activeVitrail(session),
    entry = progress.days[session.day];
  if (!puzzle || !entry || session.level > entry.completed) return invalid();
  const valid = (rotations: unknown): rotations is number[] =>
    Array.isArray(rotations) &&
    rotations.length === puzzle.cells.length &&
    rotations.every((n, i) => Number.isInteger(n) && n >= 0 && n < rotationPeriod(puzzle.cells[i]));
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
