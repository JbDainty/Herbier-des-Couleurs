import { describe, expect, it } from 'vitest';
import {
  journeyFrontier,
  journeyLayout,
  journeyPageX,
  journeyRowPath,
  MAP_ROW_HEIGHT,
} from '../src/journey/layout';
import {
  blendImageBounds,
  BLEND_HEIGHT,
  landscapeJoin,
  landscapeSlice,
} from '../src/journey/scenery';
import { ecosystemForPage } from '../src/data/ecology';
import { initial } from '../src/state/model';

describe('exploration path', () => {
  it('joins both visible halves of every turn on the side of the consecutive medals', () => {
    for (let last = 3; last < 1000; last += 3) {
      const row = last / 3 - 1;
      const lowerTurn = journeyRowPath(row, last + 1)
        .split('M')
        .at(-1)!;
      const upperTurn = journeyRowPath(row + 1, last + 1).slice(1);
      expect(lowerTurn).toContain('C');
      expect(upperTurn).toContain('C');
      const coordinates = (turn: string) => turn.match(/-?\d+/g)!.map(Number);
      const lower = coordinates(lowerTurn);
      const upper = coordinates(upperTurn);
      expect(lower[0]).toBe(journeyPageX(last));
      expect(upper.at(-2)).toBe(journeyPageX(last + 1));
      expect(upper).toEqual(lower.map((n, i) => (i % 2 ? n + MAP_ROW_HEIGHT : n)));
    }
  });
  it('stops at the last available medal, including incomplete rows on either side', () => {
    expect(journeyRowPath(0, 1)).toBe('');
    expect(journeyRowPath(0, 2)).toBe('M68 72H180');
    expect(journeyRowPath(0, 3)).toBe('M68 72H292');
    expect(journeyRowPath(13, 39)).toBe('');
    expect(journeyRowPath(13, 40)).toBe('M292 224C357 224 357 72 292 72');
    expect(journeyRowPath(13, 41)).toBe('M292 224C357 224 357 72 292 72 M292 72H180');
    expect(journeyRowPath(333, 1000)).toBe('M292 224C357 224 357 72 292 72');
  });
  it('ends at the first unfinished page while replaying an older page', () => {
    const s = initial();
    for (let id = 1; id <= 42; id++) s.completed[id] = { stars: 2, date: '2026-11-08T00:00:00Z' };
    s.current = 3;
    expect(journeyFrontier(s)).toBe(43);
    expect(journeyLayout(journeyFrontier(s)).points.at(-1)?.id).toBe(43);
    expect(journeyLayout(journeyFrontier(s)).points.some((p) => p.id === 44)).toBe(false);
  });
  it('keeps every clickable medal inside the picture and its row, through page 100', () => {
    for (let count = 1; count <= 100; count++) {
      const { points, height, path } = journeyLayout(count, 500);
      expect(points).toHaveLength(count);
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(37);
        expect(p.x).toBeLessThanOrEqual(323);
        expect(p.y - 37).toBeGreaterThanOrEqual(0);
        expect(p.y + 59).toBeLessThan(height);
      }
      expect(path).not.toMatch(/NaN|undefined/);
      expect(new Set(points.map((p) => `${p.x}/${p.y}`)).size).toBe(count);
    }
  });
  it('does not invent a page beyond the finished collection', () => {
    const s = initial();
    for (let id = 1; id <= 1000; id++) s.completed[id] = { stars: 3, date: '2026-11-08T00:00:00Z' };
    expect(journeyFrontier(s)).toBe(1000);
  });
});

describe('watercolour landscape joins', () => {
  it('blends every ecosystem boundary and repeated tile up to the current frontier', () => {
    for (let frontier = 1; frontier <= 1000; frontier++) {
      const row = Math.floor((frontier - 1) / 3);
      expect(landscapeJoin(row + 1, frontier)).toBeNull();
      if (!row) {
        expect(landscapeJoin(row, frontier)).toBeNull();
        continue;
      }
      const upper = ecosystemForPage(Math.min(frontier, row * 3 + 2));
      const lower = ecosystemForPage(row * 3 - 1);
      // Every fourth tile ends here, including repetitions within a single ecosystem.
      const expected = upper !== lower || row % 4 === 1 ? { upper, lower } : null;
      expect(landscapeJoin(row, frontier)).toEqual(expected);
    }
  });
  it('matches the cover crop beyond the wash and fills the band on both sides', () => {
    for (const [width, height] of [
      [720, 1800],
      [1024, 1536],
      [941, 1672],
    ]) {
      const scale = Math.max(360 / width, (4 * MAP_ROW_HEIGHT) / height);
      const paintedHeight = height * scale;
      for (let row = 0; row < 4; row++) {
        for (const bottom of [true, false]) {
          const box = blendImageBounds(row, bottom, width, height);
          const seam =
            (paintedHeight - 4 * MAP_ROW_HEIGHT) / 2 +
            (landscapeSlice(row) + Number(bottom)) * MAP_ROW_HEIGHT;
          const y = bottom ? 0 : BLEND_HEIGHT;
          expect(((y - box.y) * paintedHeight) / box.height).toBeCloseTo(
            seam + y - BLEND_HEIGHT / 2,
          );
          expect(box.y).toBeLessThanOrEqual(0);
          expect(box.height + box.y).toBeGreaterThanOrEqual(BLEND_HEIGHT - 0.000001);
        }
      }
    }
  });
});
