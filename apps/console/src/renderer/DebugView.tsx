import { FINGERS, type IHandFrame, type IInputSource } from "@hara/input";
import { useEffect, useState } from "react";
import { RateMeter } from "./RateMeter";

interface IDebugViewProps
{
    source: IInputSource;
}

function Bar({ value, centered }: { value: number; centered: boolean })
{
    const start = centered ? 50 + Math.min(0, value) * 50 : 0;
    const width = centered ? Math.abs(value) * 50 : value * 100;
    return (
        <div style={{ position: "relative", height: 12, width: 240, background: "#222" }}>
            <div style={{ position: "absolute", left: `${start}%`, width: `${width}%`, height: "100%", background: "#4a9eff" }} />
        </div>
    );
}

export default function DebugView({ source }: IDebugViewProps)
{
    const [frame, setFrame] = useState<IHandFrame | null>(null);
    const [rate, setRate] = useState(0);

    useEffect(() =>
    {
        const meter = new RateMeter();
        return source.subscribe((next) =>
        {
            setFrame(next);
            setRate(meter.record(next.timestamp));
        });
    }, [source]);

    return (
        <section style={{ position: "absolute", right: 16, top: 16, padding: 16, background: "#000c", fontFamily: "monospace", fontSize: 13 }}>
            <div>
                {rate}
                {" Hz"}
            </div>
            {FINGERS.map(finger => (
                <div key={finger} style={{ display: "grid", gridTemplateColumns: "56px 240px 48px 240px 40px", gap: 8, alignItems: "center", marginTop: 8 }}>
                    <span>{finger}</span>
                    <Bar value={frame?.fingers[finger].position ?? 0} centered />
                    <span>{(frame?.fingers[finger].position ?? 0).toFixed(2)}</span>
                    <Bar value={frame?.fingers[finger].force ?? 0} centered={false} />
                    <span>{(frame?.fingers[finger].force ?? 0).toFixed(2)}</span>
                </div>
            ))}
        </section>
    );
}
