import { useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "./Bridge";
import DebugView from "./DebugView";
import { createKeyboardSource } from "./KeyboardSource";
import { startTestScene } from "./TestScene";

export default function App()
{
    const canvas = useRef<HTMLCanvasElement>(null);
    const [version, setVersion] = useState("");
    const [debugging, setDebugging] = useState(false);
    const source = useMemo(() => createKeyboardSource(window), []);

    useEffect(() =>
    {
        void bridge.version().then(setVersion);
    }, []);

    useEffect(() =>
    {
        if (!canvas.current)
        {
            return;
        }
        const engine = startTestScene(canvas.current);
        return () => engine.dispose();
    }, []);

    useEffect(() =>
    {
        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.ctrlKey && event.shiftKey && event.code === "KeyD")
            {
                setDebugging(shown => !shown);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <main style={{ height: "100vh", margin: 0, display: "flex", flexDirection: "column", background: "#000", color: "#fff" }}>
            <header style={{ padding: 16, fontFamily: "system-ui" }}>
                HARA
                {" "}
                {version}
            </header>
            <canvas ref={canvas} style={{ flex: 1 }} />
            {debugging && <DebugView source={source} />}
        </main>
    );
}
