import type { Save } from './model';

/** The cabinet reads the current attempt; opening it never reloads or rewards a page. */
export function homeProgress({
  current,
  completed,
  moves,
}: Pick<Save, 'current' | 'completed' | 'moves'>) {
  const completedPages = Object.keys(completed).length;
  return {
    plant: Math.floor((current - 1) / 5),
    page: current,
    firstPage: completedPages === 0 && current === 1 && moves === 0,
    collectionComplete: completedPages === 1000,
  };
}
