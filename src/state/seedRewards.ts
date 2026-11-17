/** Kept only to read saves from the earlier economy; this ledger no longer grants seeds. */
export type ReplayRewards = { day: string; count: number };

/** Main-campaign pages grant a seed only on their first three-star completion. */
export function pageSeedReward(previousStars: number | undefined, stars: number): number {
  return stars === 3 && previousStars !== 3 ? 1 : 0;
}
