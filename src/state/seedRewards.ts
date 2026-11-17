import type { Save } from './model';
export const DAILY_REPLAY_SEEDS = 3;
export type ReplayRewards = { day: string; count: number };
/** A small renewable reward; repeated easy pages cannot generate an unlimited wallet. */
export function replayReward(
  s: Save,
  now: string,
): { earned: number; replayRewards: ReplayRewards | undefined } {
  const day = now.slice(0, 10);
  const previous = s.replayRewards;
  if (previous && previous.day > day) return { earned: 0, replayRewards: previous };
  const count = previous?.day === day ? previous.count : 0;
  if (count >= DAILY_REPLAY_SEEDS) return { earned: 0, replayRewards: previous };
  return { earned: 1, replayRewards: { day, count: count + 1 } };
}
