import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` gera a pasta dist/ normal.
// `npm run build:single` gera um único index.html com tudo embutido (fácil de compartilhar).
export default defineConfig(({ mode }) => ({
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
  base: "./",
  build: { outDir: mode === "single" ? "dist-single" : "dist" },
}));
