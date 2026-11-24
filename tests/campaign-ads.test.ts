import { afterEach, expect, it, vi } from 'vitest';
import { campaignAdBreak } from '../src/state/campaignAds';

it('uses only the third and last new pages of each species after page ten', () => {
  for (let page = 1; page <= 1000; page++) {
    const expected =
      page <= 10
        ? null
        : ((
            { 0: 'species-with-offer', 3: 'page', 5: 'species', 8: 'page' } as Record<
              number,
              string
            >
          )[page % 10] ?? null);
    expect(campaignAdBreak(page, false, false), String(page)).toBe(expected);
    expect(campaignAdBreak(page, true, false)).toBeNull();
    expect(campaignAdBreak(page, false, true)).toBeNull();
  }
});

const sdk = vi.hoisted(() => {
  const events = new Map<string, () => void>();
  const ad = {
    loaded: false,
    load: vi.fn(),
    show: vi.fn(async () => {}),
    addAdEventListener: (name: string, handler: () => void) => {
      events.set(name, handler);
      return () => events.delete(name);
    },
  };
  return {
    events,
    ad,
    create: vi.fn(() => ad),
    initialize: vi.fn(async () => {}),
    setAppMuted: vi.fn(),
  };
});
vi.mock('react-native', () => ({ AppState: { currentState: 'active' } }));
vi.mock('expo-constants', () => ({
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
vi.mock('react-native-google-mobile-ads', () => ({
  default: () => sdk,
  TestIds: { INTERSTITIAL: 'test-unit' },
  InterstitialAd: { createForAdRequest: sdk.create },
  AdEventType: { OPENED: 'opened', CLOSED: 'closed', ERROR: 'error' },
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
  sdk.events.clear();
  sdk.ad.loaded = false;
});

it('keeps ordinary Android builds free of requests', async () => {
  vi.stubEnv('EXPO_PUBLIC_CAMPAIGN_TEST_ADS', '');
  const { prepareCampaignAd } = await import('../src/services/campaignAds.android');
  expect(prepareCampaignAd()).toBeUndefined();
  expect(sdk.initialize).not.toHaveBeenCalled();
});

it('skips unavailable ads immediately and waits for dismissal only for a loaded test ad', async () => {
  vi.stubEnv('EXPO_PUBLIC_CAMPAIGN_TEST_ADS', '1');
  const { prepareCampaignAd } = await import('../src/services/campaignAds.android');
  const slot = prepareCampaignAd()!;
  expect(slot.show()).toBeUndefined();
  await vi.waitFor(() => expect(sdk.ad.load).toHaveBeenCalled());
  expect(sdk.create).toHaveBeenCalledWith('test-unit', { requestNonPersonalizedAdsOnly: true });
  sdk.ad.loaded = true;
  const done = slot.show();
  expect(done).toBeInstanceOf(Promise);
  expect(slot.show()).toBeUndefined();
  sdk.events.get('opened')!();
  sdk.events.get('closed')!();
  await expect(done).resolves.toBe(true);
  slot.dispose();
  expect(sdk.events.size).toBe(0);
});

it('does not count a failed display or a cancelled transition as a completed impression', async () => {
  vi.stubEnv('EXPO_PUBLIC_CAMPAIGN_TEST_ADS', '1');
  const { prepareCampaignAd } = await import('../src/services/campaignAds.android');
  const slot = prepareCampaignAd()!;
  await vi.waitFor(() => expect(sdk.ad.load).toHaveBeenCalled());
  sdk.ad.loaded = true;
  const done = slot.show();
  sdk.events.get('error')!();
  await expect(done).resolves.toBe(false);
  slot.dispose();
  const next = prepareCampaignAd()!;
  await vi.waitFor(() => expect(sdk.ad.load).toHaveBeenCalledTimes(2));
  const cancelled = next.show();
  next.dispose();
  await expect(cancelled).resolves.toBe(false);
});

it('continues if the native SDK accepts show but never opens; an open ad waits for the player', async () => {
  vi.stubEnv('EXPO_PUBLIC_CAMPAIGN_TEST_ADS', '1');
  const { prepareCampaignAd } = await import('../src/services/campaignAds.android');
  const slot = prepareCampaignAd()!;
  await vi.waitFor(() => expect(sdk.ad.load).toHaveBeenCalled());
  sdk.ad.loaded = true;
  vi.useFakeTimers();
  try {
    const failed = slot.show();
    await vi.advanceTimersByTimeAsync(2500);
    await expect(failed).resolves.toBe(false);
    slot.dispose();
    const next = prepareCampaignAd()!;
    await vi.waitFor(() => expect(sdk.ad.load).toHaveBeenCalledTimes(2));
    const done = next.show();
    sdk.events.get('opened')!();
    await vi.advanceTimersByTimeAsync(10000);
    sdk.events.get('closed')!();
    await expect(done).resolves.toBe(true);
    next.dispose();
  } finally {
    vi.useRealTimers();
  }
});
