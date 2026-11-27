import "@fontsource/righteous/latin-400.css";
import "@fontsource-variable/doto/full.css";
import "@fontsource-variable/figtree/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./Theme.css";

const root = document.getElementById("root");
if (!root)
{
    throw new Error("Missing #root element.");
}

function trackPointer(event: PointerEvent): void
{
    document.documentElement.classList.toggle("mouse", event.pointerType === "mouse");
}

window.addEventListener("pointermove", trackPointer, { passive: true });
window.addEventListener("pointerdown", trackPointer, { passive: true });

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
