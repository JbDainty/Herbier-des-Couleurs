import { expect, it } from 'vitest';
import { vitrailLayout } from '../src/layout/vitrail';
import { vitrailDays } from '../src/data/vitrails';

const formats = [
  [320, 400],
  [320, 432],
  [320, 480],
  [320, 568],
  [360, 640],
  [375, 667],
  [393, 760],
  [393, 852],
  [412, 915],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 900],
  [480, 280],
  [568, 320],
  [667, 375],
  [932, 430],
];
it('reserves space for the board and every control on all 1095 puzzles and 19 formats', () => {
  for (const [width, height] of formats)
    for (const fontScale of [1, 1.3])
      for (const day of vitrailDays)
        for (const puzzle of day.puzzles) {
          const l = vitrailLayout(width, height, puzzle.size, fontScale);
          expect(l.boardSize).toBeGreaterThan(150);
          expect(l.cellSize).toBeGreaterThan(25);
          expect(l.actionsHeight).toBeGreaterThanOrEqual(44);
          expect(l.stagesHeight).toBeGreaterThanOrEqual(44);
          expect(l.footerHeight).toBeGreaterThanOrEqual(44);
          expect(l.boardSize).toBeLessThanOrEqual(l.boardAreaHeight);
          if (l.landscape) {
            expect(l.boardSize + l.controlsWidth + l.gap + l.padding * 2).toBeLessThanOrEqual(
              width + 0.01,
            );
            expect(
              l.headerHeight +
                l.stagesHeight +
                l.captionHeight +
                l.actionsHeight +
                l.footerHeight +
                l.gap * 4,
            ).toBeLessThanOrEqual(l.contentHeight);
          } else {
            expect(
              l.headerHeight +
                l.stagesHeight +
                l.panelHeight +
                l.footerHeight +
                l.gap * 3 +
                l.padding * 2,
            ).toBeLessThanOrEqual(height + 0.01);
            expect(
              l.boardAreaHeight +
                l.captionHeight +
                l.actionsHeight +
                l.gap * 2 +
                l.panelVerticalPadding * 2,
            ).toBeLessThanOrEqual(l.panelHeight + 0.01);
            expect(l.boardSize + l.panelPadding * 2).toBeLessThanOrEqual(l.contentWidth);
            const stack = l.boardSize + l.captionHeight + l.actionsHeight + l.gap * 2;
            expect(stack + l.panelVerticalPadding * 2).toBeLessThanOrEqual(l.panelHeight + 0.01);
            expect(l.actionWidth + l.panelPadding * 2).toBeLessThanOrEqual(l.contentWidth);
            if (l.framed) {
              expect(l.panelPadding).toBeGreaterThanOrEqual(32);
              expect((l.panelHeight - stack) / 2).toBeGreaterThanOrEqual(48);
            }
          }
          expect(l.footerHeight).toBeGreaterThanOrEqual(l.actionsHeight + l.footerInset * 2);
          if (
            (width >= 320 && height >= 520 && !l.landscape) ||
            (l.landscape && width >= 568 && height >= 272)
          )
            expect(l.cellSize).toBeGreaterThanOrEqual(44);
        }
});
it('uses a measured viewport after safe-area insets and gives landscape the full board height', () => {
  for (const [width, height] of [
    [393, 804],
    [568, 272],
    [932, 382],
  ]) {
    const l = vitrailLayout(width, height, 5, 1.3);
    expect(l.cellSize).toBeGreaterThanOrEqual(44);
    expect(l.boardSize + l.padding * 2).toBeLessThanOrEqual(height);
  }
  expect(vitrailLayout(568, 272, 5).landscape).toBe(true);
  expect(vitrailLayout(393, 804, 5).landscape).toBe(false);
});
