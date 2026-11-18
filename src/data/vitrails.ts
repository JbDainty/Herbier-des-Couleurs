import bank from './vitrailYear.json';
import type { VitrailPuzzle } from '../engine/vitrail';

export type VitrailDay = { day: string; puzzles: [VitrailPuzzle, VitrailPuzzle, VitrailPuzzle] };
export const vitrailDays = bank.days as VitrailDay[];
const byDay = new Map(vitrailDays.map((entry) => [entry.day, entry]));
export const vitrailDayKey = (now = new Date()) => now.toISOString().slice(0, 10);
export const vitrailForDay = (day: string) => byDay.get(day);
export const vitrailRange = {
  first: vitrailDays[0].day,
  last: vitrailDays[vitrailDays.length - 1].day,
};
export const vitrailDifficulties = ['Simple', 'Intermédiaire', 'Difficile'] as const;
