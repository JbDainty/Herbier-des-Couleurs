import type { Save } from './model';
import { collectionById } from '../data/collections';
import type { Level } from '../data/campaign';
import snapshots from '../data/collectionPuzzles.json';
import challenges from '../data/collectionExpertPuzzles.json';
import { clone, pour, won, capacity, type Board, type Move } from '../engine/puzzle';
import { pageStars } from './stars';
import { initialKnowledge, moveKnowledge } from '../engine/knowledge';
import {
  gardenGuide,
  validGardenPlan,
  type CollectionPuzzle,
  type GardenGuide,
} from './gardenGuide';

export type GardenProgress = {
  species: string[];
  completed: Record<string, { stars: number; date: string }>;
};
export type GardenSession = {
  collection: string;
  species: string;
  page: number;
  board: Board;
  history: Board[];
  moves: number;
  rewarded: boolean;
  seedReward: number;
  puzzleVersion?: 1 | 2;
  known?: boolean[][];
  historyKnown?: boolean[][][];
  guide?: GardenGuide;
};
const puzzles = snapshots as Record<string, Record<string, Level[]>>;
const experts = challenges as Record<string, Record<string, CollectionPuzzle[]>>;
export const gardenPageKey = (species: string, page: number) => `${species}:${page}`;
export function gardenPuzzle(
  collection: string,
  species: string,
  page: number,
  version: 1 | 2 = 2,
): CollectionPuzzle {
  const garden = collectionById(collection);
  const index = garden?.species.findIndex((s) => s.id === species) ?? -1;
  if (!garden || index < 0 || !Number.isInteger(page) || page < 0 || page > 4)
    throw Error('Page du jardin inconnue.');
  const result = (version === 1 ? puzzles : experts)[collection]?.[species]?.[page];
  if (!result) throw Error('Puzzle du jardin indisponible.');
  return result;
}
export const sessionGardenPuzzle = (session: GardenSession) =>
  gardenPuzzle(session.collection, session.species, session.page, session.puzzleVersion ?? 1);
export const gardenStage = (s: Save, collection: string, species: string) =>
  Array.from(
    { length: 5 },
    (_, page) => !!s.gardens?.[collection]?.completed[gardenPageKey(species, page)],
  ).filter(Boolean).length;

export function startGarden(s: Save, collection: string, species: string): Save {
  if (s.testSession || !s.gardens?.[collection]?.species.includes(species)) return s;
  const session = s.gardenSession;
  if (session?.collection === collection && session.species === species && !session.rewarded)
    return s;
  const progress = s.gardens[collection];
  const missing = Array.from({ length: 5 }, (_, i) => i).find(
    (i) => !progress.completed[gardenPageKey(species, i)],
  );
  return loadGardenPage(s, collection, species, missing ?? 0);
}
export function loadGardenPage(
  s: Save,
  collection: string,
  species: string,
  page: number,
  version: 1 | 2 = 2,
): Save {
  if (
    s.testSession ||
    !s.gardens?.[collection]?.species.includes(species) ||
    page < 0 ||
    page > 4 ||
    !Number.isInteger(page)
  )
    return s;
  if (page > 0 && !s.gardens[collection].completed[gardenPageKey(species, page - 1)]) return s;
  const puzzle = gardenPuzzle(collection, species, page, version);
  return {
    ...s,
    gardenSession: {
      collection,
      species,
      page,
      board: clone(puzzle.board),
      history: [],
      moves: 0,
      rewarded: false,
      seedReward: 0,
      puzzleVersion: version,
      known: initialKnowledge(puzzle.board, puzzle.rules),
      historyKnown: [],
      guide: { at: 0, path: puzzle.solution },
    },
  };
}
export function moveGarden(
  s: Save,
  from: number,
  to: number,
  now = new Date().toISOString(),
): Save {
  const session = s.gardenSession;
  if (
    s.testSession ||
    !session ||
    session.rewarded ||
    !s.gardens?.[session.collection]?.species.includes(session.species)
  )
    return s;
  const puzzle = sessionGardenPuzzle(session);
  const board = pour(session.board, from, to, puzzle.rules);
  if (!board) return s;
  const known = session.known ?? initialKnowledge(session.board, puzzle.rules);
  const next: GardenSession = {
    ...session,
    board,
    history: [...session.history, session.board],
    moves: session.moves + 1,
    known: moveKnowledge(session.board, board, known, from, to),
    historyKnown: [
      ...(session.historyKnown ?? session.history.map((b) => initialKnowledge(b, puzzle.rules))),
      known,
    ],
  };
  const guide = gardenGuide(session, puzzle);
  next.guide =
    guide.at === session.moves && guide.path[0]?.from === from && guide.path[0]?.to === to
      ? { at: next.moves, path: guide.path.slice(1) }
      : gardenGuide(next, puzzle);
  if (!won(board, puzzle.rules)) return { ...s, gardenSession: next };
  const progress = s.gardens[session.collection];
  const key = gardenPageKey(session.species, session.page);
  const previous = progress.completed[key];
  const stars = pageStars(next.moves, puzzle.par);
  return {
    ...s,
    gardenSession: { ...next, rewarded: true, seedReward: 0 },
    gardens: {
      ...s.gardens,
      [session.collection]: {
        ...progress,
        completed: {
          ...progress.completed,
          [key]: { stars: Math.max(stars, previous?.stars ?? 0), date: previous?.date ?? now },
        },
      },
    },
  };
}
export function undoGarden(s: Save): Save {
  const session = s.gardenSession;
  if (!session?.history.length || session.rewarded) return s;
  const puzzle = sessionGardenPuzzle(session);
  const board = session.history.at(-1)!;
  const next: GardenSession = {
    ...session,
    board,
    history: session.history.slice(0, -1),
    moves: Math.max(0, session.moves - 1),
    known: session.historyKnown?.at(-1) ?? initialKnowledge(board, puzzle.rules),
    historyKnown: session.historyKnown?.slice(0, -1),
  };
  next.guide = gardenGuide(next, puzzle);
  return {
    ...s,
    gardenSession: next,
  };
}

export function rememberGardenPath(s: Save, expectedBoard: Board, path: Move[]): Save {
  const session = s.gardenSession;
  if (
    !session ||
    session.rewarded ||
    JSON.stringify(session.board) !== JSON.stringify(expectedBoard) ||
    !validGardenPlan(session.board, path, sessionGardenPuzzle(session))
  )
    return s;
  return { ...s, gardenSession: { ...session, guide: { at: session.moves, path } } };
}

/** Free recovery to the latest position with a certified continuation; ownership is untouched. */
export function recoverGarden(s: Save): Save {
  const session = s.gardenSession;
  if (!session || session.rewarded || s.testSession) return s;
  const puzzle = sessionGardenPuzzle(session);
  let guide = gardenGuide(session, puzzle);
  let board = guide.at === session.moves ? session.board : session.history[guide.at];
  if (!board || !validGardenPlan(board, guide.path, puzzle)) {
    board = puzzle.board;
    guide = { at: 0, path: puzzle.solution };
  }
  const known = guide.at === session.moves ? session.known : session.historyKnown?.[guide.at];
  return {
    ...s,
    gardenSession: {
      ...session,
      board: clone(board),
      moves: guide.at,
      history: session.history.slice(0, guide.at),
      known: known ?? initialKnowledge(board, puzzle.rules),
      historyKnown: (
        session.historyKnown ?? session.history.map((b) => initialKnowledge(b, puzzle.rules))
      ).slice(0, guide.at),
      guide,
    },
  };
}

/** All premium content is validated independently of the player's main campaign board. */
export function validateGardens(s: Save) {
  if (s.gardens === undefined && s.gardenSession === undefined) return;
  if (!s.gardens || typeof s.gardens !== 'object' || Array.isArray(s.gardens))
    throw Error('Jardins invalides.');
  for (const [id, progress] of Object.entries(s.gardens)) {
    const garden = collectionById(id);
    if (
      !garden ||
      !progress ||
      !Array.isArray(progress.species) ||
      !progress.species.length ||
      new Set(progress.species).size !== progress.species.length ||
      (garden.kind !== 'golden' && !progress.species.includes(garden.species[0].id)) ||
      progress.species.some((id) => !garden.species.some((p) => p.id === id)) ||
      !progress.completed ||
      typeof progress.completed !== 'object' ||
      Array.isArray(progress.completed)
    )
      throw Error('Collection du jardin invalide.');
    for (const [key, record] of Object.entries(progress.completed)) {
      const [species, number, ...extra] = key.split(':');
      const page = Number(number);
      if (
        extra.length ||
        !progress.species.includes(species) ||
        !/^[0-4]$/.test(number) ||
        !record ||
        ![1, 2, 3].includes(record.stars) ||
        !Number.isFinite(Date.parse(record.date))
      )
        throw Error('Page du jardin invalide.');
      if (page > 0 && !progress.completed[gardenPageKey(species, page - 1)])
        throw Error('Progression du jardin discontinue.');
    }
  }
  const session = s.gardenSession;
  if (!session) return;
  if (
    !s.gardens[session.collection]?.species.includes(session.species) ||
    !Number.isInteger(session.page) ||
    session.page < 0 ||
    session.page > 4 ||
    (session.puzzleVersion !== undefined &&
      session.puzzleVersion !== 1 &&
      session.puzzleVersion !== 2) ||
    !Number.isInteger(session.moves) ||
    session.moves < 0 ||
    typeof session.rewarded !== 'boolean' ||
    !Number.isInteger(session.seedReward) ||
    session.seedReward < 0 ||
    session.seedReward > 3
  )
    throw Error('Session du jardin invalide.');
  const puzzle = sessionGardenPuzzle(session);
  const inventory = (b: Board) =>
    b
      .flat()
      .sort((a, b) => a - b)
      .join(',');
  const expected = inventory(puzzle.board);
  const valid = (board: Board) =>
    Array.isArray(board) &&
    board.length === puzzle.board.length &&
    board.every(
      (tube, index) =>
        Array.isArray(tube) &&
        tube.length <= capacity(puzzle.rules, index) &&
        tube.every((c) => Number.isInteger(c) && c >= 0 && c < 7),
    ) &&
    inventory(board) === expected;
  if (
    !valid(session.board) ||
    !Array.isArray(session.history) ||
    session.history.length !== session.moves ||
    !session.history.every(valid) ||
    session.rewarded !== won(session.board, puzzle.rules) ||
    (session.rewarded &&
      !s.gardens[session.collection].completed[gardenPageKey(session.species, session.page)])
  )
    throw Error('Fioles du jardin invalides.');
  const validKnowledge = (flags: boolean[][], board: Board) =>
    Array.isArray(flags) &&
    flags.length === board.length &&
    flags.every(
      (tube, i) =>
        Array.isArray(tube) &&
        tube.length === board[i].length &&
        tube.every((value) => typeof value === 'boolean'),
    );
  if (
    (session.known !== undefined && !validKnowledge(session.known, session.board)) ||
    (session.historyKnown !== undefined &&
      (!Array.isArray(session.historyKnown) ||
        session.historyKnown.length !== session.history.length ||
        !session.historyKnown.every((flags, i) => validKnowledge(flags, session.history[i]))))
  )
    throw Error('Teintes du jardin invalides.');
  if (
    session.guide &&
    (!Number.isInteger(session.guide.at) ||
      session.guide.at < 0 ||
      session.guide.at > session.moves ||
      !validGardenPlan(
        session.guide.at === session.moves ? session.board : session.history[session.guide.at],
        session.guide.path,
        puzzle,
      ))
  )
    throw Error('Chemin du jardin invalide.');
  if (
    session.page > 0 &&
    !s.gardens[session.collection].completed[gardenPageKey(session.species, session.page - 1)]
  )
    throw Error('Page du jardin verrouillée.');
}
