import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppState } from 'react-native';
import type { InterstitialAd } from 'react-native-google-mobile-ads';
import type { CampaignAd } from '../state/campaignAds';

// This build profile uses Google's public sample app and ad unit, never paid impressions.
export const campaignTestAdsEnabled =
  process.env.EXPO_PUBLIC_CAMPAIGN_TEST_ADS === '1' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let interstitial: InterstitialAd | undefined;
let initialized: Promise<void> | undefined;
export function prepareCampaignAd(): CampaignAd | undefined {
  if (!campaignTestAdsEnabled) return;
  let ad: InterstitialAd | undefined;
  const listeners: (() => void)[] = [];
  let disposed = false;
  let opened = false;
  let consumed = false;
  let openingTimer: ReturnType<typeof setTimeout> | undefined;
  let finish: ((shown: boolean) => void) | undefined;
  const settle = (shown: boolean) => {
    clearTimeout(openingTimer);
    finish?.(shown);
    finish = undefined;
  };

  void (async () => {
    const {
      default: mobileAds,
      InterstitialAd,
      AdEventType,
      TestIds,
    } = await import('react-native-google-mobile-ads');
    if (disposed) return;
    initialized ??= mobileAds()
      .initialize()
      .then(() => {
        mobileAds().setAppMuted(true);
      })
      .catch((error) => {
        initialized = undefined;
        throw error;
      });
    await initialized;
    if (disposed) return;
    interstitial ??= InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });
    ad = interstitial;
    listeners.push(
      ad.addAdEventListener(AdEventType.OPENED, () => {
        opened = true;
        clearTimeout(openingTimer);
      }),
    );
    listeners.push(ad.addAdEventListener(AdEventType.CLOSED, () => settle(opened)));
    listeners.push(ad.addAdEventListener(AdEventType.ERROR, () => settle(false)));
    ad.load();
  })().catch(() => settle(false));

  return {
    show() {
      if (disposed || consumed || !ad?.loaded || AppState.currentState !== 'active') return;
      consumed = true;
      const ready = ad;
      return new Promise<boolean>((resolve) => {
        finish = resolve;
        // Android can reject a full-screen presentation without forwarding an event.
        // Once OPENED arrives the player controls when to close the ad.
        openingTimer = setTimeout(() => {
          if (interstitial === ready) interstitial = undefined;
          settle(false);
        }, 2500);
        try {
          void ready.show().catch(() => settle(false));
        } catch {
          settle(false);
        }
      });
    },
    dispose() {
      disposed = true;
      listeners.forEach((unsubscribe) => unsubscribe());
      settle(false);
    },
  };
}
