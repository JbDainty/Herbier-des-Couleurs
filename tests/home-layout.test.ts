import { expect, it } from 'vitest';
import { homeLayout } from '../src/layout/home';

const formats = [
  [320, 400],
  [320, 432],
  [320, 480],
  [320, 568],
  [360, 640],
  [393, 760],
  [390, 844],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 900],
  [480, 280],
  [480, 320],
  [568, 280],
  [667, 320],
  [740, 360],
  [932, 430],
];
it('keeps both playable adventures, the future teaser and navigation in the safe viewport', () => {
  for (const [width, height] of formats)
    for (const scale of [1, 1.3]) {
      const l = homeLayout(width, height, scale);
      expect(l.pageWidth + l.padding * 2).toBeLessThanOrEqual(width);
      expect(l.mainHeight).toBeGreaterThanOrEqual(100);
      expect(l.dailyHeight).toBeGreaterThanOrEqual(68);
      expect(l.mysteryHeight).toBeGreaterThanOrEqual(44);
      expect(l.mainWidth).toBeGreaterThan(240);
      expect(l.sideWidth).toBeGreaterThan(180);
      expect(
        l.headerHeight + l.bodyHeight + l.footerHeight + l.gap * 2 + l.padding * 2,
      ).toBeCloseTo(height);
      const stack = l.horizontal
        ? Math.max(l.mainHeight, l.dailyHeight + l.mysteryHeight + l.gap)
        : l.mainHeight + l.dailyHeight + l.mysteryHeight + l.gap * 2;
      expect(stack + l.headingHeight + (l.headingHeight ? l.gap : 0)).toBeLessThanOrEqual(
        l.bodyHeight + 0.01,
      );
      if (l.horizontal) expect(l.mainWidth + l.sideWidth + l.gap).toBeCloseTo(l.pageWidth);
    }
});
it('gives the daily game its own full-width card on portrait phones and a smaller locked teaser', () => {
  for (const [width, height] of [
    [390, 844],
    [393, 852],
    [430, 932],
    [820, 1180],
  ]) {
    const l = homeLayout(width, height);
    expect(l.horizontal).toBe(false);
    expect(l.sideWidth).toBe(l.mainWidth);
    expect(l.dailyHeight).toBeGreaterThan(160);
    expect(l.mysteryHeight).toBeLessThan(l.dailyHeight / 2);
  }
});
