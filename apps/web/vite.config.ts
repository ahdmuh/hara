import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    envDir: "../..",
    publicDir: "../../assets/public",
    envPrefix: "CONVEX_URL",
    build: { outDir: ".build" },
});
