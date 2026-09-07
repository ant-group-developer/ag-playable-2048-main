import { yt, inPlayablesEnv } from "./ytgame.js";
const STRINGS: Record<string, Record<string, string>> = {
  "en": { title:"2048", score:"Score", best:"Best", newGame:"New Game", gameOver:"Game over!", youWin:"You win!", keepGoing:"Keep going", tryAgain:"Try again", howTo:"HOW TO PLAY:", howToBody:"Use arrow keys or swipe to move tiles. When two tiles with the same number touch, they merge into one!", won:"You reached 2048! Keep going?", watchAd:"Watch ad to continue", adFailed:"Ad not available", continue:"Continue", undo:"Undo last move" },
  "vi": { title:"2048", score:"Điểm", best:"Kỷ lục", newGame:"Chơi lại", gameOver:"Thua rồi!", youWin:"Thắng rồi!", keepGoing:"Chơi tiếp", tryAgain:"Thử lại", howTo:"CÁCH CHƠI:", howToBody:"Dùng phím mũi tên hoặc vuốt để di chuyển. Hai ô cùng số chạm nhau sẽ gộp thành một!", won:"Bạn đã đạt 2048! Chơi tiếp?", watchAd:"Xem quảng cáo để tiếp tục", adFailed:"Quảng cáo chưa sẵn sàng", continue:"Tiếp tục", undo:"Hoàn tác" },
};
let lang = "en";
export async function initLanguage(): Promise<string> {
  let tag = "en-US";
  if (inPlayablesEnv()) { try { tag = await yt()!.system.getLanguage(); } catch {} }
  else { tag = navigator.language || "en-US"; }
  lang = tag.toLowerCase().startsWith("vi") ? "vi" : "en";
  document.documentElement.lang = lang;
  return lang;
}
export function t(key: string): string {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS["en"][key] || key;
}
export function getLang(): string { return lang; }
