import { yt, inPlayablesEnv } from "./ytgame.js";
export async function sendScore(score: number): Promise<void> {
  if (!inPlayablesEnv()) return;
  const v = Math.floor(score);
  if (!Number.isFinite(v) || v < 0) return;
  if (v > Number.MAX_SAFE_INTEGER) return;
  try { await yt()!.engagement.sendScore({ value: v }); } catch {}
}
