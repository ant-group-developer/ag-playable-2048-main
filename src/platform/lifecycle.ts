import { yt, inPlayablesEnv } from "./ytgame.js";
let firstFrameCalled = false;
let gameReadyCalled = false;

export function notifyFirstFrameReady(): void {
  if (firstFrameCalled) return;
  firstFrameCalled = true;
  try { yt()?.game.firstFrameReady(); } catch {}
  // Also log for debugging
  console.debug("[2048] firstFrameReady");
}

export function notifyGameReady(): void {
  if (gameReadyCalled) return;
  if (!firstFrameCalled) notifyFirstFrameReady();
  gameReadyCalled = true;
  try { yt()?.game.gameReady(); } catch {}
  console.debug("[2048] gameReady");
}

export function resetLifecycleForTest(): void {
  firstFrameCalled = false; gameReadyCalled = false;
}
export function isInPlayables(): boolean { return inPlayablesEnv(); }
