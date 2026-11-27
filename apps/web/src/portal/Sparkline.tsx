import { motion } from "motion/react";
import { EASE } from "../ui/Motion";

interface ISparklineProps
{
    values: number[];
    width?: number;
    height?: number;
}

export default function Sparkline({ values, width = 96, height = 28 }: ISparklineProps)
{
    if (values.length < 2)
    {
        return <svg width={width} height={height} aria-hidden="true" />;
    }
    const step = width / (values.length - 1);
    const low = Math.min(...values);
    const span = Math.max(Math.max(...values) - low, 0.0001);
    const points = values.map((value, index) => [index * step, height - 3 - ((value - low) / span) * (height - 6)] as const);
    const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
    const last = points.at(-1) ?? [0, 0];
    const color = (values.at(-1) ?? 0) >= (values[0] ?? 0) ? "var(--rise)" : "var(--fall)";
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: "visible" }}>
            <motion.path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: EASE }}
            />
            <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
        </svg>
    );
}
