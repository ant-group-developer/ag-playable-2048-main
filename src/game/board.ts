export const SIZE = 4;
export type Cell = number; // 0 = empty, else 2,4,8...
export type Grid = Cell[][]; // [row][col]

export interface MoveResult {
  grid: Grid;
  scoreGain: number;
  moved: boolean;
}

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}
export function cloneGrid(g: Grid): Grid { return g.map(r => r.slice()); }

function slideAndMergeRow(row: Cell[]): { row: Cell[]; gain: number; moved: boolean } {
  const filtered = row.filter(v => v !== 0);
  const result: Cell[] = [];
  let gain = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      gain += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i += 1;
    }
  }
  while (result.length < SIZE) result.push(0);
  const moved = result.some((v, idx) => v !== row[idx]);
  return { row: result, gain, moved };
}

export type Dir = "left" | "right" | "up" | "down";

export function move(grid: Grid, dir: Dir): MoveResult {
  let scoreGain = 0;
  let moved = false;
  let next: Grid;

  if (dir === "left") {
    next = grid.map(r => {
      const { row, gain, moved: m } = slideAndMergeRow(r);
      scoreGain += gain; if (m) moved = true;
      return row;
    });
  } else if (dir === "right") {
    next = grid.map(r => {
      const rev = r.slice().reverse();
      const { row, gain, moved: m } = slideAndMergeRow(rev);
      scoreGain += gain; if (m) moved = true;
      return row.reverse();
    });
  } else if (dir === "up") {
    next = emptyGrid();
    for (let c = 0; c < SIZE; c++) {
      const col = grid.map(r => r[c]);
      const { row, gain, moved: m } = slideAndMergeRow(col);
      scoreGain += gain; if (m) moved = true;
      for (let r = 0; r < SIZE; r++) next[r][c] = row[r];
    }
    // detect moved by comparing with original
    if (!moved) moved = !gridsEqual(grid, next);
  } else { // down
    next = emptyGrid();
    for (let c = 0; c < SIZE; c++) {
      const col = grid.map(r => r[c]).reverse();
      const { row, gain, moved: m } = slideAndMergeRow(col);
      scoreGain += gain; if (m) moved = true;
      const out = row.reverse();
      for (let r = 0; r < SIZE; r++) next[r][c] = out[r];
    }
    if (!moved) moved = !gridsEqual(grid, next);
  }
  // For left/right, moved already computed; for up/down we did extra check
  if (dir === "left" || dir === "right") {
    // also ensure at least one row moved flag is correct (slideAndMergeRow handles)
  }
  return { grid: next, scoreGain, moved };
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

export function hasEmpty(grid: Grid): boolean {
  return grid.some(r => r.some(v => v === 0));
}

export function canMove(grid: Grid): boolean {
  if (hasEmpty(grid)) return true;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const v = grid[r][c];
    if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
    if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
  }
  return false;
}

export function addRandomTile(grid: Grid, rng = Math.random): Grid {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return grid;
  const idx = Math.floor(rng() * empties.length);
  const [r, c] = empties[idx];
  const val = rng() < 0.9 ? 2 : 4;
  const next = cloneGrid(grid);
  next[r][c] = val;
  return next;
}

export function hasWon(grid: Grid): boolean {
  return grid.some(r => r.some(v => v >= 2048));
}
