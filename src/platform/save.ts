import { yt, inPlayablesEnv } from "./ytgame.js";

const LS_KEY = "ag2048_save_v1";

function isWellFormed(s: string): boolean {
  const fn = (String as unknown as { isWellFormed?: (s: string) => boolean }).isWellFormed;
  if (typeof fn === "function") return fn.call(String, s);
  // fallback: check lone surrogates
  try { encodeURIComponent(s); return true; } catch { return false; }
}

export async function loadSave(): Promise<string> {
  if (inPlayablesEnv()) {
    try { return (await yt()!.game.loadData()) || ""; } catch { return ""; }
  }
  try { return localStorage.getItem(LS_KEY) || ""; } catch { return ""; }
}

export async function persistSave(data: string): Promise<void> {
  if (!isWellFormed(data)) throw new Error("save data not well-formed UTF-16");
  // 3 MiB UTF-16 limit — each JS char is 2 bytes
  if (data.length * 2 > 3 * 1024 * 1024) throw new Error("save data exceeds 3 MiB");
  if (inPlayablesEnv()) {
    try { await yt()!.game.saveData(data); return; } catch (e) { throw e; }
  }
  try { localStorage.setItem(LS_KEY, data); } catch {}
}

export function clearLocalSave(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
