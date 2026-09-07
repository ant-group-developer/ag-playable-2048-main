import { yt, inPlayablesEnv } from "./ytgame.js";
import type { SdkError } from "./ytgame.js";

export type AdResult =
  | { ok: true }
  | { ok: false; reason: string; errorType?: string };

export type RewardedResult =
  | { ok: true; rewarded: true }
  | { ok: false; rewarded: false; reason: string; errorType?: string };

export async function showInterstitial(): Promise<AdResult> {
  if (!inPlayablesEnv()) {
    console.debug("[ads] interstitial skipped — not in Playables env");
    return { ok: false, reason: "not_in_playables" };
  }
  try {
    await yt()!.ads.requestInterstitialAd();
    console.debug("[ads] interstitial shown");
    return { ok: true };
  } catch (e) {
    const err = e as SdkError;
    const reason = err?.errorType ?? err?.message ?? "UNKNOWN";
    console.debug("[ads] interstitial not shown:", reason);
    return { ok: false, reason, errorType: err?.errorType };
  }
}

export async function showRewarded(rewardId: string): Promise<RewardedResult> {
  if (!inPlayablesEnv()) {
    console.debug("[ads] rewarded skipped — not in Playables env");
    return { ok: false, rewarded: false, reason: "not_in_playables" };
  }
  if (!rewardId) {
    return { ok: false, rewarded: false, reason: "INVALID_PARAMS" };
  }
  try {
    const granted = await yt()!.ads.requestRewardedAd(rewardId);
    console.debug("[ads] rewarded result:", granted);
    return granted
      ? { ok: true, rewarded: true }
      : { ok: false, rewarded: false, reason: "dismissed" };
  } catch (e) {
    const err = e as SdkError;
    const reason = err?.errorType ?? err?.message ?? "UNKNOWN";
    console.debug("[ads] rewarded error:", reason);
    return { ok: false, rewarded: false, reason, errorType: err?.errorType };
  }
}

let lastInterstitialAt = 0;
const INTERSTITIAL_COOLDOWN_MS = 60_000;

export function canShowInterstitial(): boolean {
  return Date.now() - lastInterstitialAt >= INTERSTITIAL_COOLDOWN_MS;
}
export function markInterstitialShown(): void {
  lastInterstitialAt = Date.now();
}
