import { expect, it } from 'vitest';
import { initial } from '../src/state/model';
import {
  calendarInitialMonth,
  calendarMonth,
  calendarVine,
  shiftCalendarMonth,
} from '../src/state/vitrailCalendar';
import { vitrailCalendarLayout } from '../src/layout/vitrailCalendar';
import { vitrailDays } from '../src/data/vitrails';

it('places dates on the right weekday and includes four, five and six-week months', () => {
  expect(calendarMonth('2026-11', '2026-11-19').cells.find((d) => d?.number === 1)?.index).toBe(6);
  expect(calendarMonth('2027-02', '2027-11-17').rows).toBe(4);
  expect(calendarMonth('2027-06', '2027-11-17').rows).toBe(5);
  expect(calendarMonth('2027-05', '2027-11-17').rows).toBe(6);
  for (const month of new Set(vitrailDays.map((d) => d.day.slice(0, 7)))) {
    const model = calendarMonth(month, '2027-11-17');
    const days = model.cells.filter((d) => d);
    expect(days[0]!.number).toBe(1);
    expect(days.at(-1)!.number).toBe(
      new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate(),
    );
    expect(new Set(days.map((d) => d!.day)).size).toBe(days.length);
  }
});
it('stamps completed archives regardless of seed reward and keeps partial leaves distinct', () => {
  const save = initial();
  save.vitrail = {
    version: 1,
    seen: [],
    days: {
      '2026-11-18': { completed: 3, rewarded: false },
      '2026-11-19': { completed: 2, rewarded: false },
      '2026-11-20': { completed: 3, rewarded: true },
    },
  };
  const before = JSON.stringify(save),
    model = calendarMonth('2026-11', '2026-11-19', save.vitrail);
  expect(model.stamped).toBe(1);
  expect(model.restored).toBe(5);
  expect(model.available).toBe(2);
  expect(model.scheduled).toBe(13);
  expect(calendarMonth('2026-11', '2026-11-20').scheduled).toBe(model.scheduled);
  expect(calendarMonth('2027-05', '2027-11-17').scheduled).toBe(31);
  expect(model.cells.find((d) => d?.day === '2026-11-18')?.completed).toBe(3);
  expect(model.cells.find((d) => d?.day === '2026-11-19')?.completed).toBe(2);
  expect(model.cells.find((d) => d?.day === '2026-11-20')).toMatchObject({
    available: false,
    completed: 0,
    today: false,
  });
  expect(model.cells.find((d) => d?.day === '2026-11-17')?.available).toBe(false);
  expect(JSON.stringify(save)).toBe(before);
});
it('has stable botanical motifs and prevents month navigation beyond the published date range', () => {
  expect(calendarMonth('2026-11', '2026-11-19').canPrevious).toBe(false);
  expect(calendarMonth('2026-11', '2026-11-19').canNext).toBe(false);
  expect(calendarMonth('2027-10', '2027-11-17').canNext).toBe(true);
  expect(calendarMonth('2027-11', '2028-01-01').canNext).toBe(false);
  expect(calendarInitialMonth('2028-01-01', '2028-01-01')).toBe('2027-11');
  expect(calendarInitialMonth('2026-10-01', '2026-10-01')).toBe('2026-11');
  expect(shiftCalendarMonth('2026-12', 1)).toBe('2027-01');
  expect(shiftCalendarMonth('2027-01', -1)).toBe('2026-12');
  const model = calendarMonth('2026-11', '2026-11-19');
  expect(calendarMonth('2026-11', '2026-11-19')).toEqual(model);
  for (const day of model.cells.filter((d) => d)) {
    expect(day!.motif).toBeGreaterThanOrEqual(0);
    expect(day!.motif).toBeLessThan(3);
    expect(Math.abs(day!.tilt)).toBeLessThanOrEqual(5);
  }
});
it('routes the living vine through row boundaries instead of across date numerals', () => {
  const progress = {
    version: 1 as const,
    seen: [],
    days: Object.fromEntries(
      Array.from({ length: 28 }, (_, i) => [
        `2027-02-${String(i + 1).padStart(2, '0')}`,
        { completed: 3, rewarded: false },
      ]),
    ),
  };
  const model = calendarMonth('2027-02', '2027-11-17', progress);
  const path = calendarVine(model.cells, 50, 60);
  expect(path).not.toMatch(/NaN|Infinity/);
  expect(path).toContain('L25 60');
  expect(path).toContain('L25 120');
  expect(calendarVine(calendarMonth('2026-11', '2026-11-19').cells, 50, 60)).toBe('');
});
it('keeps month controls and closing action inside the dialog across phone and tablet formats', () => {
  for (const [width, height] of [
    [320, 400],
    [320, 568],
    [393, 760],
    [393, 852],
    [430, 932],
    [768, 1024],
    [820, 1180],
    [480, 280],
    [568, 320],
    [932, 430],
    [1024, 768],
  ])
    for (const rows of [4, 5, 6]) {
      const l = vitrailCalendarLayout(width - 24, height - 48, rows);
      expect(l.paperWidth).toBeLessThanOrEqual(width - 24);
      expect(l.paperHeight).toBeLessThanOrEqual(height - 48);
      expect(l.cellWidth).toBeGreaterThan(32);
      expect(l.cellHeight).toBeGreaterThanOrEqual(36);
      expect(l.gridHeight).toBeLessThanOrEqual(l.gridContentHeight);
      const fixed =
        l.padding * 2 +
        l.headerHeight +
        l.monthHeight +
        l.weekHeight +
        l.summaryHeight +
        l.legendHeight +
        l.noteHeight +
        l.closeHeight +
        l.gap *
          (3 +
            (l.headerHeight ? 1 : 0) +
            (l.summaryHeight ? 1 : 0) +
            (l.legendHeight ? 1 : 0) +
            (l.noteHeight ? 1 : 0));
      if (!l.landscape) expect(fixed + l.gridHeight).toBeLessThanOrEqual(l.paperHeight + 0.01);
      else
        expect(
          l.monthHeight + l.weekHeight + l.gridHeight + l.gap * 2 + l.padding * 2,
        ).toBeLessThanOrEqual(l.paperHeight + 0.01);
    }
});
