import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
    main: { build: { outDir: ".build/main" } },
    preload: { build: { outDir: ".build/preload" } },
    renderer: { plugins: [react()], build: { outDir: ".build/renderer" } },
});
