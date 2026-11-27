import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
    main: { build: { outDir: ".build/main", externalizeDeps: { exclude: ["@hara/input"] } } },
    preload: { build: { outDir: ".build/preload" } },
    renderer: { plugins: [react()], envDir: resolve(__dirname, "../.."), envPrefix: ["VITE_", "CONVEX_URL"], build: { outDir: ".build/renderer" } },
});
