import "./styles/base.css";
import "./styles/board.css";
import "./styles/animations.css";
import { ensureMock } from "./platform/ytgame.js";
import { notifyFirstFrameReady, notifyGameReady } from "./platform/lifecycle.js";
import { onAudioChange, isAudioEnabled } from "./platform/audio.js";
import { loadSave, persistSave } from "./platform/save.js";
import { initLanguage, t } from "./platform/i18n.js";
import { sendScore } from "./platform/engagement.js";
import { buildBoardDOM, renderTiles } from "./ui/board-view.js";
import { createOverlay } from "./ui/overlay.js";
import { bindInput } from "./input/input-handler.js";
import { emptyGrid, addRandomTile, move, canMove, hasWon, type Grid, type Dir } from "./game/board.js";
import type { SaveState } from "./game/storage.js";

// Ensure mock exists before anything else if SDK not loaded
ensureMock();

let grid: Grid = emptyGrid();
let score = 0;
let best = 0;
let over = false;
let won = false;
let keepPlaying = false;
let tilesEl!: HTMLElement;
let overlay!: ReturnType<typeof createOverlay>;
let unbindInput: (() => void) | null = null;
let paused = false;

// DOM refs
const scoreEl = () => document.getElementById("scoreVal")!;
const bestEl = () => document.getElementById("bestVal")!;

function updateScores(): void {
  scoreEl().textContent = String(score);
  bestEl().textContent = String(best);
}

let prevGrid: Grid | undefined;
function render(): void {
  renderTiles(tilesEl, grid, prevGrid);
}

function serialize(): string {
  const state: SaveState = { grid, score, best, over, won, keepPlaying };
  return JSON.stringify(state);
}

let saveTimer: number | undefined;
function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    persistSave(serialize()).catch(() => {});
    sendScore(best).catch(() => {});
  }, 300);
}
function saveNow(): void {
  window.clearTimeout(saveTimer);
  persistSave(serialize()).catch(() => {});
  sendScore(best).catch(() => {});
}

function spawnInitial(): void {
  grid = emptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  score = 0; over = false; won = false; keepPlaying = false;
}

function restart(): void {
  spawnInitial();
  prevGrid = undefined;
  overlay.hide();
  render();
  updateScores();
  saveNow();
}

function handleDir(dir: Dir): void {
  if (over || paused) return;
  if (won && !keepPlaying) return; // waiting for keep-going choice
  const before = grid.map(r => r.slice());
  const { grid: next, scoreGain, moved } = move(grid, dir);
  if (!moved) return;
  prevGrid = before;
  grid = addRandomTile(next);
  score += scoreGain;
  if (score > best) best = score;
  updateScores();
  render();

  if (!won && hasWon(grid)) {
    won = true;
    overlay.showWon(
      () => { keepPlaying = true; overlay.hide(); saveNow(); },
      () => restart()
    );
  } else if (!canMove(grid)) {
    over = true;
    overlay.showOver(() => restart());
  }
  scheduleSave();
}

async function loadState(): Promise<void> {
  try {
    const raw = await loadSave();
    if (!raw) { spawnInitial(); return; }
    const s = JSON.parse(raw) as SaveState;
    if (!s.grid || s.grid.length !== 4) { spawnInitial(); return; }
    grid = s.grid; score = s.score ?? 0; best = s.best ?? 0;
    over = !!s.over; won = !!s.won; keepPlaying = !!s.keepPlaying;
    // validate grid values
    const valid = grid.every(r => r.length === 4 && r.every(v => Number.isInteger(v) && v >= 0));
    if (!valid) { spawnInitial(); return; }
    // if loaded state is already over/won, show overlay after render
  } catch {
    spawnInitial();
  }
}

async function bootstrap(): Promise<void> {
  await initLanguage();

  // Build static header texts
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = (el as HTMLElement).dataset.i18n!;
    (el as HTMLElement).textContent = t(k);
  });

  const boardWrap = document.getElementById("boardWrap") as HTMLElement;
  const built = buildBoardDOM(boardWrap);
  tilesEl = built.tilesEl;
  overlay = createOverlay(boardWrap);

  await loadState();
  render();
  updateScores();

  // First frame ready after initial render
  requestAnimationFrame(() => {
    notifyFirstFrameReady();
    // gameReady after load + render
    notifyGameReady();
  });

  if (over) overlay.showOver(() => restart());
  else if (won && !keepPlaying) overlay.showWon(() => { keepPlaying = true; overlay.hide(); saveNow(); }, () => restart());

  // Input
  unbindInput = bindInput(boardWrap, handleDir, restart);
  document.getElementById("newGameBtn")?.addEventListener("click", restart);

  // Pause/Resume + audio from SDK
  try {
    const yt = (window as unknown as { ytgame?: { system: { onPause:(cb:()=>void)=>()=>void; onResume:(cb:()=>void)=>()=>void } } }).ytgame;
    if (yt) {
      yt.system.onPause(() => { paused = true; saveNow(); });
      yt.system.onResume(() => { paused = false; });
    }
  } catch {}

  // Audio mute state (placeholder — no audio in 2048 yet, but wiring ready)
  let audioEnabled = isAudioEnabled();
  onAudioChange(v => { audioEnabled = v; });
  void audioEnabled;

  // Save on page hide / before unload (covers eviction case)
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });
  window.addEventListener("pagehide", saveNow);
  window.addEventListener("beforeunload", saveNow);
}

bootstrap().catch(e => console.error(e));
