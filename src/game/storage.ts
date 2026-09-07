import type { Grid } from "./board.js";
export interface SaveState {
  grid: Grid;
  score: number;
  best: number;
  over: boolean;
  won: boolean;
  keepPlaying: boolean;
}
