import { useId, type ReactNode } from "react";
import type { MilestoneKind } from "./Games";

interface IStyle
{
    from: string;
    to: string;
    ink: string;
    shape: "hexagon" | "circle" | "medal" | "shield" | "square";
    glyph: ReactNode;
}

const NUMBER = { fontFamily: "var(--figure)", fontWeight: 700, fontSize: 11, textAnchor: "middle" } as const;

const STYLES: Record<MilestoneKind, IStyle> = {
    linked: {
        from: "#2dd4bf",
        to: "#0f766e",
        ink: "#ffffff",
        shape: "hexagon",
        glyph: (
            <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <rect x="11" y="16.5" width="10" height="7" rx="3.5" />
                <rect x="19" y="16.5" width="10" height="7" rx="3.5" />
            </g>
        ),
    },
    first: {
        from: "#4ade80",
        to: "#15803d",
        ink: "#ffffff",
        shape: "circle",
        glyph: <path fill="currentColor" d="M20 10 L22.6 17.4 L30 20 L22.6 22.6 L20 30 L17.4 22.6 L10 20 L17.4 17.4 Z" />,
    },
    sessions10: {
        from: "#e8a46c",
        to: "#8a4b22",
        ink: "#fff7ed",
        shape: "medal",
        glyph: <text x="20" y="22.5" fill="currentColor" style={NUMBER}>10</text>,
    },
    sessions25: {
        from: "#f3f4f6",
        to: "#9ca3af",
        ink: "#1f2937",
        shape: "medal",
        glyph: <text x="20" y="22.5" fill="currentColor" style={NUMBER}>25</text>,
    },
    sessions50: {
        from: "#fde047",
        to: "#ca8a04",
        ink: "#422006",
        shape: "medal",
        glyph: <text x="20" y="22.5" fill="currentColor" style={NUMBER}>50</text>,
    },
    difficulty: {
        from: "#c4b5fd",
        to: "#6d28d9",
        ink: "#ffffff",
        shape: "shield",
        glyph: (
            <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 21 L20 15.5 L26 21" />
                <path d="M14 26.5 L20 21 L26 26.5" />
            </g>
        ),
    },
    range: {
        from: "#fdba74",
        to: "#c2410c",
        ink: "#ffffff",
        shape: "square",
        glyph: (
            <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M11.5 26 A9 9 0 0 1 28.5 26" opacity="0.45" />
                <path d="M11.5 26 A9 9 0 0 1 25 17.5" />
                <circle cx="20" cy="26" r="1.6" fill="currentColor" stroke="none" />
            </g>
        ),
    },
};

function Shape({ shape, fill }: { shape: IStyle["shape"]; fill: string })
{
    switch (shape)
    {
        case "hexagon":
            return <path d="M20 3 L34.7 11.5 V28.5 L20 37 L5.3 28.5 V11.5 Z" fill={fill} />;
        case "circle":
            return <circle cx="20" cy="20" r="16.5" fill={fill} />;
        case "medal":
            return (
                <g>
                    <path d="M13 26 L9 38 L14 35.5 L17 39 L19.5 28 Z" fill="#334155" opacity="0.85" />
                    <path d="M27 26 L31 38 L26 35.5 L23 39 L20.5 28 Z" fill="#334155" opacity="0.85" />
                    <circle cx="20" cy="19" r="14" fill={fill} />
                    <circle cx="20" cy="19" r="11" fill="none" stroke="rgb(255 255 255 / 45%)" strokeWidth="1" />
                </g>
            );
        case "shield":
            return <path d="M20 3 L34 8.5 V19 C34 28 27.5 34 20 37 C12.5 34 6 28 6 19 V8.5 Z" fill={fill} />;
        default:
            return <rect x="4" y="4" width="32" height="32" rx="10" fill={fill} />;
    }
}

export default function MilestoneBadge({ kind, size = 32 }: { kind: MilestoneKind; size?: number })
{
    const id = useId();
    const style = STYLES[kind];
    const gradient = `badge-${id}`;
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ flex: "none", color: style.ink, overflow: "visible" }}>
            <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor={style.from} />
                    <stop offset="1" stopColor={style.to} />
                </linearGradient>
            </defs>
            <Shape shape={style.shape} fill={`url(#${gradient})`} />
            <g transform={style.shape === "medal" ? "translate(0 -1)" : undefined}>{style.glyph}</g>
        </svg>
    );
}
