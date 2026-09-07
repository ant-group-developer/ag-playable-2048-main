import type { Grid } from "../game/board.js";

export function renderTiles(container: HTMLElement, grid: Grid, prevGrid?: Grid): void {
  container.innerHTML = "";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      const el = document.createElement("div");
      el.className = `tile v${v}`;
      el.textContent = String(v);
      el.style.gridRow = String(r + 1);
      el.style.gridColumn = String(c + 1);
      // simple new-tile / merged detection
      if (prevGrid && prevGrid[r][c] === 0) el.classList.add("new");
      container.appendChild(el);
    }
  }
}

export function buildBoardDOM(boardWrap: HTMLElement): { tilesEl: HTMLElement; gridEl: HTMLElement } {
  boardWrap.innerHTML = "";
  const gridEl = document.createElement("div");
  gridEl.className = "grid";
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    gridEl.appendChild(cell);
  }
  const tilesEl = document.createElement("div");
  tilesEl.className = "tiles";
  tilesEl.setAttribute("aria-label", "2048 board");
  boardWrap.appendChild(gridEl);
  boardWrap.appendChild(tilesEl);
  return { tilesEl, gridEl };
}
