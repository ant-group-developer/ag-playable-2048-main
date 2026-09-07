import { t } from "../platform/i18n.js";

export type OverlayApi = {
  showWon: (onKeep: () => void, onRestart: () => void) => void;
  showOver: (opts: {
    onRestart: () => void;
    onRewarded?: () => void;
    canRewarded?: boolean;
  }) => void;
  hide: () => void;
  toast: (msg: string) => void;
};

export function createOverlay(boardWrap: HTMLElement): OverlayApi {
  const overlay = document.createElement("div");
  overlay.className = "overlay hidden";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-live", "polite");
  boardWrap.appendChild(overlay);

  // toast container (outside overlay, so visible even when overlay hidden)
  const toastEl = document.createElement("div");
  toastEl.className = "toast hidden";
  toastEl.setAttribute("aria-live", "polite");
  boardWrap.appendChild(toastEl);
  let toastTimer: number | undefined;

  function toast(msg: string): void {
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add("hidden"), 2500);
  }

  function showWon(onKeep: () => void, onRestart: () => void): void {
    overlay.innerHTML = `<h2>${t("youWin")}</h2><p>${t("won")}</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" id="keepBtn">${t("keepGoing")}</button><button class="btn secondary" id="restartBtn2">${t("newGame")}</button></div>`;
    overlay.classList.remove("hidden");
    overlay.querySelector("#keepBtn")?.addEventListener("click", onKeep);
    overlay.querySelector("#restartBtn2")?.addEventListener("click", onRestart);
  }

  function showOver(opts: { onRestart: () => void; onRewarded?: () => void; canRewarded?: boolean }): void {
    const adBtn = opts.onRewarded
      ? `<button class="btn ad-btn" id="adBtn">${t("watchAd")} — ${t("undo")}</button>`
      : "";
    overlay.innerHTML = `<h2>${t("gameOver")}</h2><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" id="retryBtn">${t("tryAgain")}</button>${adBtn}</div>`;
    overlay.classList.remove("hidden");
    overlay.querySelector("#retryBtn")?.addEventListener("click", opts.onRestart);
    if (opts.onRewarded) {
      const b = overlay.querySelector("#adBtn") as HTMLButtonElement | null;
      b?.addEventListener("click", () => {
        // prevent double-tap while ad loads
        if (b) b.disabled = true;
        opts.onRewarded!();
      });
    }
  }

  function hide(): void { overlay.classList.add("hidden"); overlay.innerHTML = ""; }
  return { showWon, showOver, hide, toast };
}
