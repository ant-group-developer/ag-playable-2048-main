import { t } from "../platform/i18n.js";

export function createOverlay(boardWrap: HTMLElement): {
  showWon: (onKeep: () => void, onRestart: () => void) => void;
  showOver: (onRestart: () => void) => void;
  hide: () => void;
} {
  const overlay = document.createElement("div");
  overlay.className = "overlay hidden";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-live", "polite");
  boardWrap.appendChild(overlay);

  function showWon(onKeep: () => void, onRestart: () => void): void {
    overlay.innerHTML = `<h2>${t("youWin")}</h2><p>${t("won")}</p><div style="display:flex;gap:8px;justify-content:center"><button class="btn" id="keepBtn">${t("keepGoing")}</button><button class="btn secondary" id="restartBtn2">${t("newGame")}</button></div>`;
    overlay.classList.remove("hidden");
    overlay.querySelector("#keepBtn")?.addEventListener("click", onKeep);
    overlay.querySelector("#restartBtn2")?.addEventListener("click", onRestart);
  }
  function showOver(onRestart: () => void): void {
    overlay.innerHTML = `<h2>${t("gameOver")}</h2><div><button class="btn" id="retryBtn">${t("tryAgain")}</button></div>`;
    overlay.classList.remove("hidden");
    overlay.querySelector("#retryBtn")?.addEventListener("click", onRestart);
  }
  function hide(): void { overlay.classList.add("hidden"); overlay.innerHTML = ""; }
  return { showWon, showOver, hide };
}
