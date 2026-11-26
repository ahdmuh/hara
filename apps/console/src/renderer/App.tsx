import { useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "./Bridge";
import DebugView from "./DebugView";
import type { IDeviceStatus } from "../main/DeviceConnection";
import { createDeviceSource } from "./DeviceSource";
import { createKeyboardSource } from "./KeyboardSource";
import { startTestScene } from "./TestScene";

const INPUT = import.meta.env.VITE_INPUT ?? (import.meta.env.DEV ? "keyboard" : "device");

function describe(status: IDeviceStatus | null): string
{
    if (!status?.connected)
    {
        return "Looking for Device";
    }
    return `Device Connected, Firmware ${status.firmware}`;
}

export default function App()
{
    const canvas = useRef<HTMLCanvasElement>(null);
    const [version, setVersion] = useState("");
    const [debugging, setDebugging] = useState(false);
    const [device, setDevice] = useState<IDeviceStatus | null>(null);
    const source = useMemo(() => INPUT === "keyboard" ? createKeyboardSource(window) : createDeviceSource(bridge), []);

    useEffect(() =>
    {
        void bridge.version().then(setVersion);
        void bridge.deviceStatus().then(setDevice);
        return bridge.onDeviceStatus(setDevice);
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
                {`HARA ${version} · ${describe(device)}`}
                {INPUT === "keyboard" && " · Keyboard Input"}
            </header>
            <canvas ref={canvas} style={{ flex: 1 }} />
            {debugging && <DebugView source={source} />}
        </main>
    );
}
