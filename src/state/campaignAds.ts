/** Each campaign species has five pages. A replay never creates a new ad break. */
export function campaignAdBreak(page: number, replay: boolean, testSession: boolean) {
  if (replay || testSession || !Number.isInteger(page) || page <= 10 || page > 1000) return null;
  if (page % 5 === 3) return 'page';
  if (page % 5 !== 0) return null;
  return page % 10 === 0 ? 'species-with-offer' : 'species';
}

export type CampaignAd = {
  show: () => Promise<boolean> | undefined;
  dispose: () => void;
};
