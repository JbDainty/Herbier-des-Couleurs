import { vitrailForDay, vitrailRange } from '../data/vitrails';
import type { VitrailProgress } from './vitrail';

export type CalendarDay = {
  day: string;
  number: number;
  index: number;
  available: boolean;
  today: boolean;
  completed: number;
  motif: number;
  tilt: number;
};

export function calendarMonth(month: string, today: string, progress?: VitrailProgress) {
  const first = new Date(month + '-01T12:00:00Z');
  const offset = (first.getUTCDay() + 6) % 7;
  const length = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const rows = Math.ceil((offset + length) / 7);
  const cells: (CalendarDay | null)[] = Array.from({ length: rows * 7 }, (_, index) => {
    const number = index - offset + 1;
    if (number < 1 || number > length) return null;
    const day = month + '-' + String(number).padStart(2, '0');
    const available = !!vitrailForDay(day) && day <= today;
    const hash = Number(day.replace(/-/g, ''));
    return {
      day,
      number,
      index,
      available,
      today: available && day === today,
      completed: available ? (progress?.days[day]?.completed ?? 0) : 0,
      motif: hash % 3,
      tilt: (hash % 11) - 5,
    };
  });
  const days = cells.filter((day): day is CalendarDay => !!day);
  return {
    cells,
    rows,
    stamped: days.filter((day) => day.completed === 3).length,
    restored: days.reduce((sum, day) => sum + day.completed, 0),
    available: days.filter((day) => day.available).length,
    scheduled: days.filter((day) => !!vitrailForDay(day.day)).length,
    canPrevious: month > vitrailRange.first.slice(0, 7),
    canNext: month < today.slice(0, 7) && month < vitrailRange.last.slice(0, 7),
  };
}

export function calendarInitialMonth(day: string, today: string) {
  const last = today < vitrailRange.last ? today : vitrailRange.last;
  const value = day < vitrailRange.first ? vitrailRange.first : day > last ? last : day;
  return value < vitrailRange.first ? vitrailRange.first.slice(0, 7) : value.slice(0, 7);
}
export function shiftCalendarMonth(month: string, delta: number) {
  const date = new Date(month + '-01T12:00:00Z');
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1))
    .toISOString()
    .slice(0, 7);
}

/** A low vine travels below the numerals and wraps between rows, never diagonally across dates. */
export function calendarVine(cells: (CalendarDay | null)[], cellWidth: number, cellHeight: number) {
  const stamped = cells.filter((day): day is CalendarDay => !!day && day.completed === 3);
  if (stamped.length < 2) return '';
  const first = stamped[0].index,
    last = stamped[stamped.length - 1].index;
  const point = (index: number) => [
    ((index % 7) + 0.5) * cellWidth,
    (Math.floor(index / 7) + 0.79) * cellHeight,
  ];
  let [x, y] = point(first),
    path = `M${x} ${y}`;
  for (let index = first + 1; index <= last; index++) {
    const [nx, ny] = point(index);
    if (index % 7 === 0) {
      const middle = Math.floor(index / 7) * cellHeight;
      path += `C${x + cellWidth * 0.44} ${y} ${x + cellWidth * 0.44} ${middle} ${x} ${middle}L${nx} ${middle}C${nx - cellWidth * 0.44} ${middle} ${nx - cellWidth * 0.44} ${ny} ${nx} ${ny}`;
    } else path += `Q${(x + nx) / 2} ${y - cellHeight * 0.05} ${nx} ${ny}`;
    [x, y] = [nx, ny];
  }
  return path;
}
