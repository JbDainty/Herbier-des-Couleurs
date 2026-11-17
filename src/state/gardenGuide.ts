import type { Level } from '../data/campaign';
import { pour, won, type Board, type Move } from '../engine/puzzle';
import type { GardenSession } from './gardens';

export type CollectionPuzzle = Level & { alternatives?: Move[][]; source?: number };
export type GardenGuide = { at: number; path: Move[] };
const same = (a: Board, b: Board) => JSON.stringify(a) === JSON.stringify(b);

export function validGardenPlan(board: Board, path: Move[], puzzle: CollectionPuzzle) {
  if (!Array.isArray(path) || path.length > 140) return false;
  let current = board;
  for (const move of path) {
    if (!move || !Number.isInteger(move.from) || !Number.isInteger(move.to)) return false;
    const next = pour(current, move.from, move.to, puzzle.rules);
    if (!next) return false;
    current = next;
  }
  return won(current, puzzle.rules);
}
export function certifiedGardenContinuation(
  board: Board,
  puzzle: CollectionPuzzle,
): Move[] | undefined {
  for (const path of [puzzle.solution, ...(puzzle.alternatives ?? [])]) {
    let current = puzzle.board;
    for (let i = 0; i <= path.length; i++) {
      if (same(current, board)) return path.slice(i);
      if (i === path.length) break;
      const step = path[i];
      current = pour(current, step.from, step.to, puzzle.rules)!;
    }
  }
}

/** Keep a concrete winning witness, never an unproved claim that a board is solvable. */
export function gardenGuide(session: GardenSession, puzzle: CollectionPuzzle): GardenGuide {
  const previous = session.guide;
  if (previous?.at === session.moves && validGardenPlan(session.board, previous.path, puzzle))
    return previous;
  const current = certifiedGardenContinuation(session.board, puzzle);
  if (current) return { at: session.moves, path: current };
  const validPrevious =
    previous &&
    previous.at <= session.moves &&
    validGardenPlan(session.history[previous.at] ?? session.board, previous.path, puzzle);
  for (let at = session.history.length - 1; at >= (validPrevious ? previous.at + 1 : 0); at--) {
    const path = certifiedGardenContinuation(session.history[at], puzzle);
    if (path) return { at, path };
  }
  return validPrevious ? previous : { at: 0, path: puzzle.solution };
}
