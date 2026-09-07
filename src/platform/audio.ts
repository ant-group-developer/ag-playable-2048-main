import { yt } from "./ytgame.js";
export function isAudioEnabled(): boolean {
  try { return yt()?.system.isAudioEnabled() ?? true; } catch { return true; }
}
export function onAudioChange(cb: (enabled: boolean) => void): () => void {
  try {
    const off = yt()?.system.onAudioEnabledChange(cb);
    if (typeof off === "function") return off;
  } catch {}
  return () => {};
}
