// Typed wrapper around window.ytgame — safe to call outside Playables env.
export type SdkErrorType = "API_UNAVAILABLE" | "INVALID_PARAMS" | "SIZE_LIMIT_EXCEEDED" | "UNKNOWN";
export interface SdkError extends Error { errorType?: SdkErrorType; }

declare global {
  interface Window {
    ytgame?: {
      IN_PLAYABLES_ENV?: boolean;
      SDK_VERSION?: string;
      game: {
        firstFrameReady: () => void;
        gameReady: () => void;
        loadData: () => Promise<string>;
        saveData: (data: string) => Promise<void>;
      };
      system: {
        isAudioEnabled: () => boolean;
        onAudioEnabledChange: (cb: (v: boolean) => void) => () => void;
        onPause: (cb: () => void) => () => void;
        onResume: (cb: () => void) => () => void;
        getLanguage: () => Promise<string>;
      };
      engagement: {
        sendScore: (s: { value: number }) => Promise<void>;
        openYTContent?: (c: unknown) => Promise<void>;
      };
      ads: {
        requestInterstitialAd: () => Promise<void>;
        requestRewardedAd: (id: string) => Promise<boolean>;
      };
      health: { logError: (...a: unknown[]) => void; logWarning: (...a: unknown[]) => void; };
    };
  }
}

export function inPlayablesEnv(): boolean {
  return typeof window !== "undefined" && !!window.ytgame?.IN_PLAYABLES_ENV;
}
export function yt(): Window["ytgame"] | undefined { return window.ytgame; }

// Dev mock so game works without SDK (local dev / preview)
export function ensureMock(): void {
  if (typeof window === "undefined") return;
  if (window.ytgame) return;
  // Only mock when not in real Playables — helps local dev without SDK script
  const noop = () => {};
  window.ytgame = {
    IN_PLAYABLES_ENV: false,
    SDK_VERSION: "mock-0.0.0",
    game: {
      firstFrameReady: noop,
      gameReady: noop,
      loadData: async () => { try { return localStorage.getItem("__2048_mock_save") || ""; } catch { return ""; } },
      saveData: async (d: string) => { try { localStorage.setItem("__2048_mock_save", d); } catch {} },
    },
    system: {
      isAudioEnabled: () => true,
      onAudioEnabledChange: () => noop as unknown as () => () => void,
      onPause: () => noop as unknown as () => () => void,
      onResume: () => noop as unknown as () => () => void,
      getLanguage: async () => navigator.language || "en-US",
    },
    engagement: { sendScore: async () => {} },
    ads: { requestInterstitialAd: async () => {}, requestRewardedAd: async () => false },
    health: { logError: noop, logWarning: noop },
  } as unknown as Window["ytgame"];
}
