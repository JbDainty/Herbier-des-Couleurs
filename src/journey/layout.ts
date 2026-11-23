import type { Save } from '../state/model';

export const ROW_HEIGHT = 132;
export const MAP_WIDTH = 360;
export const MAP_ROW_HEIGHT = 152;
export const MAP_NODE_Y = 72;

export function journeyPageX(id: number) {
  const index = id - 1;
  const column = index % 3;
  return Math.floor(index / 3) % 2 ? 292 - column * 112 : 68 + column * 112;
}

function turnToRow(x: number, fromY: number, toY: number) {
  const outerX = x + (x > MAP_WIDTH / 2 ? 65 : -65);
  return `C${outerX} ${fromY} ${outerX} ${toY} ${x} ${toY}`;
}

export function journeyRowPath(row: number, frontier: number) {
  const first = 3 * row + 1;
  if (first > frontier) return '';
  const last = Math.min(first + 2, frontier);
  const startX = journeyPageX(first);
  const endX = journeyPageX(last);
  const y = MAP_NODE_Y;
  const segments = [];
  // Adjacent rows clip the same complete turn so its curve and dots meet at the seam.
  if (row > 0) {
    const below = y + MAP_ROW_HEIGHT;
    segments.push(`M${startX} ${below}${turnToRow(startX, below, y)}`);
  }
  if (last > first) segments.push(`M${startX} ${y}H${endX}`);
  if (last < frontier) {
    segments.push(`M${endX} ${y}${turnToRow(endX, y, y - MAP_ROW_HEIGHT)}`);
  }
  return segments.join(' ');
}

/** The explored route ends at the first unfinished page, even while replaying an old page. */
export function journeyFrontier(save: Save) {
  if (save.testSession) return 1000;
  let id = 1;
  while (id < 1000 && save.completed[id]) id++;
  return id;
}
export function journeyLayout(frontier: number, minimumHeight = 0) {
  const lastRow = Math.floor((frontier - 1) / 3);
  const height = Math.max(minimumHeight, 220 + lastRow * ROW_HEIGHT);
  const points = Array.from({ length: frontier }, (_, i) => {
    const row = Math.floor(i / 3);
    return {
      id: i + 1,
      x: journeyPageX(i + 1),
      y: height - 110 - row * ROW_HEIGHT,
    };
  });
  const path = points
    .map((p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const previous = points[i - 1];
      return previous.y === p.y ? `L${p.x} ${p.y}` : turnToRow(p.x, previous.y, p.y);
    })
    .join(' ');
  return { height, points, path };
}
