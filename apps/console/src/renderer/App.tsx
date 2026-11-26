import { useEffect, useRef, useState } from "react";
import { bridge } from "./Bridge";
import { startTestScene } from "./TestScene";

export default function App()
{
    const canvas = useRef<HTMLCanvasElement>(null);
    const [version, setVersion] = useState("");

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

    return (
        <main style={{ height: "100vh", margin: 0, display: "flex", flexDirection: "column", background: "#000", color: "#fff" }}>
            <header style={{ padding: 16, fontFamily: "system-ui" }}>
                HARA
                {" "}
                {version}
            </header>
            <canvas ref={canvas} style={{ flex: 1 }} />
        </main>
    );
}
