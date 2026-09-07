# 2048 — YouTube Playables

Clone của https://play2048.co/ tích hợp YouTube Playables SDK, build bằng Vite + TypeScript (không React).

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # -> dist/
npm run preview
```

## Tích hợp Playables SDK

1. Lấy SDK URL từ https://developers.google.com/youtube/gaming/playables/reference/sdk
2. Trong `index.html`, uncomment đoạn script SDK và điền URL thật — **phải load trước mọi game code** (MUST).
3. Khi chạy trong YouTube, `window.ytgame.IN_PLAYABLES_ENV === true` sẽ kích hoạt: `firstFrameReady`/`gameReady`, `saveData`/`loadData` (3 MiB limit), `onPause`/`onResume`, `isAudioEnabled`/`onAudioEnabledChange`, `getLanguage`, `sendScore`.

Khi chạy ngoài Playables (local dev), `src/platform/ytgame.ts` tự mock bằng `localStorage` nên vẫn chơi/test được.

## Đóng gói để submit

```bash
npm run build
# Zip nội dung dist/ sao cho index.html nằm ở root của zip
# (không lồng folder)
```

Test bằng Playables Test Suite trước khi submit qua Developer Portal.

## Cấu trúc

```
src/game/       logic 2048 (board, move/merge, spawn)
src/ui/         render DOM + overlay
src/input/      keyboard + swipe
src/platform/   wrapper ytgame SDK (lifecycle, audio, save, i18n, engagement)
src/styles/     CSS
```
