/** Kept only to read saves from the earlier economy; this ledger no longer grants seeds. */
export type ReplayRewards = { day: string; count: number };

/** Each page grants one first-clear seed and one first-three-star seed, at most once each. */
export function pageSeedReward(previousStars: number | undefined, stars: number): number {
  return (previousStars === undefined ? 1 : 0) + (stars === 3 && previousStars !== 3 ? 1 : 0);
}
