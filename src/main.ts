import "./styles/base.css";
import "./styles/board.css";
import "./styles/animations.css";
import { ensureMock } from "./platform/ytgame.js";
import { notifyFirstFrameReady, notifyGameReady } from "./platform/lifecycle.js";
import { onAudioChange, isAudioEnabled } from "./platform/audio.js";
import { loadSave, persistSave } from "./platform/save.js";
import { initLanguage, t } from "./platform/i18n.js";
import { sendScore, flushScore } from "./platform/engagement.js";
import { showInterstitial, showRewarded, canShowInterstitial, markInterstitialShown } from "./platform/ads.js";
import { buildBoardDOM, renderTiles } from "./ui/board-view.js";
import { createOverlay } from "./ui/overlay.js";
import { bindInput } from "./input/input-handler.js";
import { emptyGrid, addRandomTile, move, canMove, hasWon, cloneGrid, type Grid, type Dir } from "./game/board.js";
import type { SaveState } from "./game/storage.js";

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

// snapshot for rewarded undo
let prevSnapshot: SaveState | null = null;
let rewardedUsedThisGame = false;

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
  const state: SaveState = { grid: cloneGrid(grid), score, best, over, won, keepPlaying };
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
  // flush ensures leaderboard gets final best even if debounced
  flushScore(best).catch(() => {});
}

// interstitial before restart — never blocks game if ad unavailable
async function maybeInterstitialThen(fn: () => void): Promise<void> {
  if (canShowInterstitial()) {
    const r = await showInterstitial();
    if (r.ok) markInterstitialShown();
  }
  fn();
}

function spawnInitial(): void {
  grid = emptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  score = 0; over = false; won = false; keepPlaying = false;
  rewardedUsedThisGame = false;
  prevSnapshot = null;
}

function restart(): void {
  // try interstitial, then actually restart
  void maybeInterstitialThen(() => {
    spawnInitial();
    prevGrid = undefined;
    overlay.hide();
    render();
    updateScores();
    saveNow();
  });
}

function handleDir(dir: Dir): void {
  if (over || paused) return;
  if (won && !keepPlaying) return;
  const before = cloneGrid(grid);
  const beforeScore = score;
  const beforeOver = over;
  const { grid: next, scoreGain, moved } = move(grid, dir);
  if (!moved) return;
  // snapshot before random tile for undo (only keep last)
  prevSnapshot = { grid: before, score: beforeScore, best, over: beforeOver, won, keepPlaying };
  prevGrid = before;
  grid = addRandomTile(next);
  score += scoreGain;
  if (score > best) best = score;
  updateScores();
  render();

  if (!won && hasWon(grid)) {
    won = true;
    // win also flushes score
    flushScore(best).catch(() => {});
    overlay.showWon(
      () => { keepPlaying = true; overlay.hide(); saveNow(); },
      () => restart()
    );
  } else if (!canMove(grid)) {
    over = true;
    flushScore(best).catch(() => {});
    showGameOver();
  }
  scheduleSave();
}

function showGameOver(): void {
  const canReward = !!prevSnapshot && !rewardedUsedThisGame;
  overlay.showOver({
    onRestart: () => restart(),
    onRewarded: canReward ? handleRewardedUndo : undefined,
  });
}

async function handleRewardedUndo(): Promise<void> {
  if (!prevSnapshot || rewardedUsedThisGame) return;
  const res = await showRewarded("undo_last_move");
  if (res.rewarded) {
    rewardedUsedThisGame = true;
    // restore snapshot
    grid = cloneGrid(prevSnapshot.grid);
    score = prevSnapshot.score;
    over = false;
    // keep won/keepPlaying as in snapshot
    won = prevSnapshot.won;
    keepPlaying = prevSnapshot.keepPlaying;
    prevGrid = undefined;
    prevSnapshot = null;
    overlay.hide();
    render();
    updateScores();
    saveNow();
  } else {
    // dismissed or unavailable — re-render overlay with retry enabled
    if (res.reason === "dismissed") {
      overlay.toast(t("adFailed"));
      // re-show with button re-enabled
      showGameOver();
    } else if (res.reason === "not_in_playables") {
      // outside YouTube — still grant undo for testing
      rewardedUsedThisGame = true;
      grid = cloneGrid(prevSnapshot.grid);
      score = prevSnapshot.score;
      over = false;
      won = prevSnapshot.won;
      keepPlaying = prevSnapshot.keepPlaying;
      prevGrid = undefined;
      prevSnapshot = null;
      overlay.hide();
      render();
      updateScores();
      saveNow();
    } else {
      overlay.toast(t("adFailed"));
      showGameOver();
    }
  }
}

async function loadState(): Promise<void> {
  try {
    const raw = await loadSave();
    if (!raw) { spawnInitial(); return; }
    const s = JSON.parse(raw) as SaveState;
    if (!s.grid || s.grid.length !== 4) { spawnInitial(); return; }
    grid = s.grid; score = s.score ?? 0; best = s.best ?? 0;
    over = !!s.over; won = !!s.won; keepPlaying = !!s.keepPlaying;
    const valid = grid.every(r => r.length === 4 && r.every(v => Number.isInteger(v) && v >= 0));
    if (!valid) { spawnInitial(); return; }
  } catch {
    spawnInitial();
  }
}

async function bootstrap(): Promise<void> {
  await initLanguage();
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

  requestAnimationFrame(() => {
    notifyFirstFrameReady();
    notifyGameReady();
  });

  if (over) showGameOver();
  else if (won && !keepPlaying) overlay.showWon(() => { keepPlaying = true; overlay.hide(); saveNow(); }, () => restart());

  unbindInput = bindInput(boardWrap, handleDir, restart);
  document.getElementById("newGameBtn")?.addEventListener("click", restart);

  try {
    const yt = (window as unknown as { ytgame?: { system: { onPause:(cb:()=>void)=>()=>void; onResume:(cb:()=>void)=>()=>void } } }).ytgame;
    if (yt) {
      yt.system.onPause(() => { paused = true; saveNow(); });
      yt.system.onResume(() => { paused = false; });
    }
  } catch {}

  let audioEnabled = isAudioEnabled();
  onAudioChange(v => { audioEnabled = v; });
  void audioEnabled;

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });
  window.addEventListener("pagehide", saveNow);
  window.addEventListener("beforeunload", saveNow);
}

bootstrap().catch(e => console.error(e));
