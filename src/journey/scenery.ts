import { ecosystemForPage } from '../data/ecology';
import { MAP_ROW_HEIGHT, MAP_WIDTH } from './layout';

export const LANDSCAPE_ROWS = 4;
export const BLEND_HEIGHT = MAP_ROW_HEIGHT * 0.73;

export const landscapeSlice = (row: number) =>
  (LANDSCAPE_ROWS - (row % LANDSCAPE_ROWS)) % LANDSCAPE_ROWS;
export const rowEcosystem = (row: number, frontier: number) =>
  ecosystemForPage(Math.min(frontier, row * 3 + 2));

export function landscapeJoin(upperRow: number, frontier: number) {
  if (upperRow < 1 || upperRow * 3 + 1 > frontier) return null;
  const upper = rowEcosystem(upperRow, frontier);
  const lower = rowEcosystem(upperRow - 1, frontier);
  // An uninterrupted crop already joins exactly. The fourth slice wraps back to the first.
  if (upper === lower && landscapeSlice(upperRow) !== LANDSCAPE_ROWS - 1) return null;
  return { upper, lower };
}

/** Match the normal centered cover crop at the outer edge of the wash.
 * When a painting ends within the overlap, stretch just its available strip up to the fade. */
export function blendImageBounds(row: number, atBottom: boolean, width: number, height: number) {
  const tileHeight = LANDSCAPE_ROWS * MAP_ROW_HEIGHT;
  const scale = Math.max(MAP_WIDTH / width, tileHeight / height);
  const paintedHeight = height * scale;
  const boundary =
    (paintedHeight - tileHeight) / 2 + (landscapeSlice(row) + (atBottom ? 1 : 0)) * MAP_ROW_HEIGHT;
  const start = Math.max(0, boundary - BLEND_HEIGHT / 2);
  const end = Math.min(paintedHeight, boundary + BLEND_HEIGHT / 2);
  const stretch = BLEND_HEIGHT / (end - start);
  return {
    x: (MAP_WIDTH - width * scale) / 2,
    y: -start * stretch,
    width: width * scale,
    height: paintedHeight * stretch,
  };
}
