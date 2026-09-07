import { yt, inPlayablesEnv } from "./ytgame.js";

let lastSent = -1;
let pending: number | null = null;
let flushTimer: number | undefined;

/**
 * Gửi điểm lên YouTube leaderboard.
 * - Chỉ chạy trong Playables env, ngoài env là no-op.
 * - Chặn trùng/nhỏ hơn điểm đã gửi (YouTube không cần spam).
 * - Debounce 800ms để không gọi liên tục mỗi nước đi.
 */
export async function sendScore(score: number): Promise<void> {
  if (!inPlayablesEnv()) return;
  const v = Math.floor(score);
  if (!Number.isFinite(v) || v < 0) return;
  if (v > Number.MAX_SAFE_INTEGER) return;
  if (v <= lastSent) return; // không gửi điểm thấp hơn/bằng

  // debounce: dồn các lần gọi liên tiếp, chỉ gửi lần cuối
  pending = v;
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(async () => {
    const toSend = pending!;
    pending = null;
    try {
      await yt()!.engagement.sendScore({ value: toSend });
      lastSent = toSend;
      console.debug("[engagement] sendScore", toSend);
    } catch (e) {
      console.debug("[engagement] sendScore failed", e);
    }
  }, 800);
}

/** Gửi ngay, bỏ debounce — dùng khi game over / pause */
export async function flushScore(score: number): Promise<void> {
  if (!inPlayablesEnv()) return;
  const v = Math.floor(score);
  if (!Number.isFinite(v) || v < 0 || v > Number.MAX_SAFE_INTEGER) return;
  if (v <= lastSent) return;
  window.clearTimeout(flushTimer);
  pending = null;
  try {
    await yt()!.engagement.sendScore({ value: v });
    lastSent = v;
    console.debug("[engagement] flushScore", v);
  } catch (e) {
    console.debug("[engagement] flushScore failed", e);
  }
}

export function getLastSentScore(): number { return lastSent; }
