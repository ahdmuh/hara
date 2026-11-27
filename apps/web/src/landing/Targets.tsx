import type { CSSProperties } from "react";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Targets.module.css";

function Response()
{
    return (
        <svg className={styles.art} viewBox="0 0 160 56" aria-hidden="true">
            <rect className={styles.window} x="34" y="14" width="92" height="28" rx="6" />
            <circle className={styles.node} cx="20" cy="28" r="7" />
            <rect className={styles.node} x="132" y="20" width="18" height="16" rx="3" />
            <circle className={styles.pulse} cx="20" cy="28" r="4" />
        </svg>
    );
}

function Rate()
{
    return (
        <svg className={styles.art} viewBox="0 0 160 56" aria-hidden="true">
            {Array.from({ length: 20 }, (_, index) => (
                <rect key={index} className={styles.tick} style={{ "--i": index } as CSSProperties} x={6 + index * 7.5} y="16" width="3.5" height="24" rx="1.75" />
            ))}
        </svg>
    );
}

function Position()
{
    return (
        <svg className={styles.art} viewBox="0 0 160 56" aria-hidden="true">
            <rect className={styles.band} x="68" y="10" width="24" height="36" rx="4" />
            {Array.from({ length: 17 }, (_, index) => (
                <line key={index} className={styles.rule} x1={8 + index * 9} x2={8 + index * 9} y1={index % 4 === 0 ? 22 : 27} y2="34" />
            ))}
            <rect className={styles.marker} x="78" y="12" width="4" height="32" rx="2" />
        </svg>
    );
}

function Force()
{
    return (
        <svg className={styles.art} viewBox="0 0 160 56" aria-hidden="true">
            <path className={styles.arc} d="M44,50 A36,36 0 0 1 116,50" />
            <path className={styles.zone} d="M71.5,15.2 A36,36 0 0 1 88.5,15.2" />
            <g className={styles.needle}>
                <line x1="80" y1="50" x2="80" y2="20" />
                <circle cx="80" cy="50" r="4" />
            </g>
        </svg>
    );
}

const TARGETS = [
    { sign: "≤", value: "100", unit: "ms", label: "From finger to screen", art: Response },
    { sign: "≥", value: "100", unit: "Hz", label: "Readings every second", art: Rate },
    { sign: "±", value: "5", unit: "%", label: "Position accuracy", art: Position },
    { sign: "±", value: "10", unit: "%", label: "Force accuracy", art: Force },
];

export default function Targets()
{
    return (
        <Reveal className={styles.targets} group>
            <RevealItem as="header" className={styles.head}>
                <h3>Targets</h3>
            </RevealItem>
            <ul className={styles.list}>
                {TARGETS.map(target => (
                    <RevealItem as="li" key={target.label} className={styles.item}>
                        <target.art />
                        <span className={styles.value}>
                            <span className={styles.sign}>{target.sign}</span>
                            {target.value}
                            <small>{target.unit}</small>
                        </span>
                        <span className={styles.label}>{target.label}</span>
                    </RevealItem>
                ))}
            </ul>
        </Reveal>
    );
}
