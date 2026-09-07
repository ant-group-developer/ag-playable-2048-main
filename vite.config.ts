import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: "es2020",
    outDir: "dist",
    assetsDir: "assets",
  },
});
