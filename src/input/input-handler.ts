import type { Dir } from "../game/board.js";
export type DirCallback = (dir: Dir) => void;

export function bindInput(
  target: HTMLElement,
  onDir: DirCallback,
  onRestart: () => void
): () => void {
  const keyMap: Record<string, Dir> = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", W: "up", s: "down", S: "down", a: "left", A: "left", d: "right", D: "right",
  };
  const onKey = (e: KeyboardEvent) => {
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); onDir(dir); }
    if (e.key === "r" || e.key === "R") onRestart();
  };
  window.addEventListener("keydown", onKey);

  // touch swipe
  let sx = 0, sy = 0;
  let tracking = false;
  const THRESHOLD = 24;

  const onStart = (x: number, y: number) => { sx = x; sy = y; tracking = true; };
  const onEnd = (x: number, y: number) => {
    if (!tracking) return; tracking = false;
    const dx = x - sx, dy = y - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? "right" : "left");
    else onDir(dy > 0 ? "down" : "up");
  };

  const tStart = (e: TouchEvent) => { if (e.touches[0]) onStart(e.touches[0].clientX, e.touches[0].clientY); };
  const tEnd = (e: TouchEvent) => { const t = e.changedTouches[0]; if (t) onEnd(t.clientX, t.clientY); };
  const pStart = (e: PointerEvent) => { if (e.pointerType === "mouse" && e.button !== 0) return; onStart(e.clientX, e.clientY); };
  const pEnd = (e: PointerEvent) => onEnd(e.clientX, e.clientY);

  target.addEventListener("touchstart", tStart, { passive: true });
  target.addEventListener("touchend", tEnd, { passive: true });
  target.addEventListener("pointerdown", pStart);
  target.addEventListener("pointerup", pEnd);

  return () => {
    window.removeEventListener("keydown", onKey);
    target.removeEventListener("touchstart", tStart);
    target.removeEventListener("touchend", tEnd);
    target.removeEventListener("pointerdown", pStart);
    target.removeEventListener("pointerup", pEnd);
  };
}
