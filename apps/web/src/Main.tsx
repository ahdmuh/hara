import "@fontsource/michroma/index.css";
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

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
