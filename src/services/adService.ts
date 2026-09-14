import { Capacitor } from '@capacitor/core';

export type RewardType = 'revive' | 'double-coins' | 'reroll' | 'free-chest';

let rewardedReady = false;
let interstitialCount = 0;
let lastInterstitial = 0;

export const AdService = {
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({ initializeForTesting: true });
      rewardedReady = true;
    } catch {
      rewardedReady = false;
    }
  },
  async showRewarded(_type: RewardType): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    if (!rewardedReady) return false;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
      const reward = await AdMob.showRewardVideoAd();
      return reward.amount > 0;
    } catch {
      return false;
    }
  },
  canShowInterstitial(): boolean {
    return interstitialCount < 3 && Date.now() - lastInterstitial > 120_000;
  },
  recordInterstitialShown(): void {
    interstitialCount += 1;
    lastInterstitial = Date.now();
  },
};
