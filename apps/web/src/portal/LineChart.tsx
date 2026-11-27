import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { EASE } from "../ui/Motion";
import styles from "./LineChart.module.css";

export interface ISeries
{
    name: string;
    color: string;
    values: number[];
}

interface ILineChartProps
{
    dates: number[];
    series: ISeries[];
    maximum: number;
    unit: string;
    digits: number;
    target?: number;
}

const HEIGHT = 300;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" });

export default function LineChart({ dates, series, maximum, unit, digits, target }: ILineChartProps)
{
    const ref = useRef<SVGSVGElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<number | null>(null);
    const [width, setWidth] = useState(720);

    useEffect(() =>
    {
        const element = box.current;
        if (!element)
        {
            return;
        }
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry?.contentRect.width ?? 720))));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const plotWidth = width - PADDING.left - PADDING.right;
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const count = dates.length;

    const x = (index: number) => PADDING.left + (count > 1 ? (index / (count - 1)) * plotWidth : plotWidth / 2);
    const y = (value: number) => PADDING.top + plotHeight - (Math.min(value, maximum) / maximum) * plotHeight;

    const paths = series.map(entry => ({
        ...entry,
        d: entry.values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(""),
    }));

    const ticks = [0, 0.25, 0.5, 0.75, 1].map(fraction => fraction * maximum);
    const labelIndexes = count > 1 ? [0, Math.floor((count - 1) / 2), count - 1] : [0];

    function track(event: PointerEvent<SVGSVGElement>): void
    {
        const bounds = ref.current?.getBoundingClientRect();
        if (!bounds || count === 0)
        {
            return;
        }
        const position = ((event.clientX - bounds.left) / bounds.width) * width;
        const index = Math.round(((position - PADDING.left) / plotWidth) * (count - 1));
        setHover(Math.min(Math.max(index, 0), count - 1));
    }

    if (count === 0)
    {
        return <div className={styles.empty}>No sessions yet</div>;
    }

    const hoverDate = hover === null ? undefined : dates[hover];

    return (
        <div ref={box} className={styles.chart}>
            <svg
                ref={ref}
                viewBox={`0 0 ${width} ${HEIGHT}`}
                className={styles.svg}
                onPointerMove={track}
                onPointerLeave={() => setHover(null)}
                role="img"
                aria-label={`${series.length} series over ${count} sessions`}
            >
                {ticks.map(tick => (
                    <g key={tick}>
                        <line className={styles.grid} x1={PADDING.left} x2={width - PADDING.right} y1={y(tick)} y2={y(tick)} />
                        <text className={styles.axis} x={PADDING.left - 10} y={y(tick) + 4} textAnchor="end">{tick.toFixed(0)}</text>
                    </g>
                ))}
                {target !== undefined && (
                    <g>
                        <line className={styles.target} x1={PADDING.left} x2={width - PADDING.right} y1={y(target)} y2={y(target)} />
                        <text className={styles.targetLabel} x={width - PADDING.right} y={y(target) - 6} textAnchor="end">Target</text>
                    </g>
                )}
                {labelIndexes.map(index => (
                    <text key={index} className={styles.axis} x={x(index)} y={HEIGHT - 6} textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}>
                        {DATE_FORMAT.format(dates[index] ?? 0)}
                    </text>
                ))}
                {paths.map(path => (
                    <motion.path
                        key={path.name}
                        d={path.d}
                        fill="none"
                        stroke={path.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: EASE }}
                    />
                ))}
                {hover !== null && (
                    <g>
                        <line className={styles.cursor} x1={x(hover)} x2={x(hover)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} />
                        {series.map(entry => (
                            <circle key={entry.name} cx={x(hover)} cy={y(entry.values[hover] ?? 0)} r="5" fill={entry.color} stroke="var(--white)" strokeWidth="2" />
                        ))}
                    </g>
                )}
            </svg>
            <AnimatePresence>
                {hover !== null && hoverDate !== undefined && (
                    <motion.div
                        className={styles.tooltip}
                        style={{ left: `${(x(hover) / width) * 100}%` }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15, ease: EASE }}
                    >
                        <strong>{DATE_FORMAT.format(hoverDate)}</strong>
                        {series.map(entry => (
                            <span key={entry.name}>
                                <i style={{ background: entry.color }} />
                                {entry.name}
                                <b>{`${(entry.values[hover] ?? 0).toFixed(digits)} ${unit}`}</b>
                            </span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
