import type { Save } from './model';
import { collectionById } from '../data/collections';
import type { Level } from '../data/campaign';
import snapshots from '../data/collectionPuzzles.json';
import { clone, pour, won, type Board } from '../engine/puzzle';
import { pageStars } from './stars';
import { pageSeedReward } from './seedRewards';

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
};
const puzzles = snapshots as Record<string, Record<string, Level[]>>;
export const gardenPageKey = (species: string, page: number) => `${species}:${page}`;
export function gardenPuzzle(collection: string, species: string, page: number) {
  const garden = collectionById(collection);
  const index = garden?.species.findIndex((s) => s.id === species) ?? -1;
  if (!garden || index < 0 || !Number.isInteger(page) || page < 0 || page > 4)
    throw Error('Page du jardin inconnue.');
  const result = puzzles[collection]?.[species]?.[page];
  if (!result) throw Error('Puzzle du jardin indisponible.');
  return result;
}
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
export function loadGardenPage(s: Save, collection: string, species: string, page: number): Save {
  if (
    s.testSession ||
    !s.gardens?.[collection]?.species.includes(species) ||
    page < 0 ||
    page > 4 ||
    !Number.isInteger(page)
  )
    return s;
  if (page > 0 && !s.gardens[collection].completed[gardenPageKey(species, page - 1)]) return s;
  return {
    ...s,
    gardenSession: {
      collection,
      species,
      page,
      board: clone(gardenPuzzle(collection, species, page).board),
      history: [],
      moves: 0,
      rewarded: false,
      seedReward: 0,
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
  const puzzle = gardenPuzzle(session.collection, session.species, session.page);
  const board = pour(session.board, from, to, puzzle.rules);
  if (!board) return s;
  const next = {
    ...session,
    board,
    history: [...session.history, session.board],
    moves: session.moves + 1,
  };
  if (!won(board, puzzle.rules)) return { ...s, gardenSession: next };
  const progress = s.gardens[session.collection];
  const key = gardenPageKey(session.species, session.page);
  const previous = progress.completed[key];
  const stars = pageStars(next.moves, puzzle.par);
  const earned = pageSeedReward(previous?.stars, stars);
  return {
    ...s,
    gardenSession: { ...next, rewarded: true, seedReward: earned },
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
    seeds: s.seeds + earned,
  };
}
export function undoGarden(s: Save): Save {
  const session = s.gardenSession;
  if (!session?.history.length || session.rewarded) return s;
  return {
    ...s,
    gardenSession: {
      ...session,
      board: session.history.at(-1)!,
      history: session.history.slice(0, -1),
      moves: Math.max(0, session.moves - 1),
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
      new Set(progress.species).size !== progress.species.length ||
      !progress.species.includes(garden.species[0].id) ||
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
    !Number.isInteger(session.moves) ||
    session.moves < 0 ||
    typeof session.rewarded !== 'boolean' ||
    !Number.isInteger(session.seedReward) ||
    session.seedReward < 0 ||
    session.seedReward > 3
  )
    throw Error('Session du jardin invalide.');
  const puzzle = gardenPuzzle(session.collection, session.species, session.page);
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
      (tube) =>
        Array.isArray(tube) &&
        tube.length <= 4 &&
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
  if (
    session.page > 0 &&
    !s.gardens[session.collection].completed[gardenPageKey(session.species, session.page - 1)]
  )
    throw Error('Page du jardin verrouillée.');
}
