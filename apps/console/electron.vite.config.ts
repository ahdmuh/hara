import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
    main: { build: { outDir: ".build/main", externalizeDeps: { exclude: ["@hara/input"] } } },
    preload: { build: { outDir: ".build/preload" } },
    renderer: { plugins: [react()], build: { outDir: ".build/renderer" } },
});
