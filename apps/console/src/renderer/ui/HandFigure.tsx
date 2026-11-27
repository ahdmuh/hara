import { type Finger } from "@hara/input";
import { motion } from "motion/react";
import styles from "./HandFigure.module.css";

export interface IFingerPose
{
    curl: number;
    spread: number;
}

export type HandPose = Record<Finger, IFingerPose>;

interface IDigit
{
    knuckle: [number, number];
    angle: number;
    length: number;
    base: number;
    tip: number;
}

const DIGITS: Record<Exclude<Finger, "thumb">, IDigit> = {
    index: { knuckle: [45.5, 64], angle: -13, length: 50, base: 14, tip: 16.5 },
    middle: { knuckle: [60.5, 60], angle: -3, length: 56, base: 14.5, tip: 17 },
    ring: { knuckle: [75, 61], angle: 7, length: 51, base: 14, tip: 16.5 },
    pinky: { knuckle: [88.5, 66.5], angle: 18, length: 40, base: 12.5, tip: 14.5 },
};

const THUMB: IDigit = { knuckle: [42, 116], angle: -58, length: 48, base: 20, tip: 16.5 };

const PALM = "M40,146 C33,130 30,114 31,98 C32,83 34,71 38,63 C53,57 76,55 95,60 C100,76 101,93 99,109 C97,125 92,137 86,146 C74,150 52,150 40,146 Z";

const WRIST = "M45,138 L45,160 C45,163.5 47.5,166 51,166 L80,166 C83.5,166 86,163.5 86,160 L86,138 Z";

function crease(x: number, y: number): string
{
    return `M${x - 4.5},${y + 3.5} Q${x},${y + 6.5} ${x + 4.5},${y + 3.5}`;
}

const TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] } as const;

function clamp(value: number): number
{
    return Math.min(1, Math.max(0, value));
}

function capsule(x: number, y: number, angle: number, length: number, base: number, tip: number): string
{
    const radians = (angle * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const nx = Math.cos(radians);
    const ny = Math.sin(radians);
    const startX = x - dx * 10;
    const startY = y - dy * 10;
    const reach = Math.max(length, tip) - tip / 2;
    const endX = x + dx * reach;
    const endY = y + dy * reach;
    const f = (value: number) => value.toFixed(2);
    return [
        `M${f(startX - nx * base / 2)},${f(startY - ny * base / 2)}`,
        `L${f(endX - nx * tip / 2)},${f(endY - ny * tip / 2)}`,
        `A${f(tip / 2)},${f(tip / 2)} 0 0 1 ${f(endX + nx * tip / 2)},${f(endY + ny * tip / 2)}`,
        `L${f(startX + nx * base / 2)},${f(startY + ny * base / 2)}`,
        "Z",
    ].join(" ");
}

function finger(digit: IDigit, pose: IFingerPose): { back: string; fold: string; folded: number }
{
    const angle = digit.angle * (1 + pose.spread * 1.3);
    const back = capsule(digit.knuckle[0], digit.knuckle[1], angle, digit.length * (1 - 0.8 * pose.curl), digit.base, digit.tip);
    const folded = clamp((pose.curl - 0.35) / 0.65);
    const reach = Math.max(digit.tip, digit.length * 0.55 * folded);
    const fold = capsule(digit.knuckle[0], digit.knuckle[1] + 2, angle + 180, reach, digit.tip + 1, digit.tip);
    return { back, fold, folded };
}

function thumb(pose: IFingerPose): string
{
    const angle = THUMB.angle - 18 * pose.spread + 46 * pose.curl;
    return capsule(THUMB.knuckle[0], THUMB.knuckle[1], angle, THUMB.length * (1 - 0.22 * pose.curl), THUMB.base, THUMB.tip);
}

export function tipOf(name: Finger, pose: IFingerPose): [number, number]
{
    const digit = name === "thumb" ? THUMB : DIGITS[name];
    const angle = name === "thumb" ? THUMB.angle - 18 * pose.spread + 46 * pose.curl : digit.angle * (1 + pose.spread * 1.3);
    const length = name === "thumb" ? THUMB.length * (1 - 0.22 * pose.curl) : digit.length * (1 - 0.8 * pose.curl);
    const radians = (angle * Math.PI) / 180;
    return [digit.knuckle[0] + Math.sin(radians) * (length - digit.tip / 2), digit.knuckle[1] - Math.cos(radians) * (length - digit.tip / 2)];
}

interface IHandFigureProps
{
    pose: HandPose;
    highlight?: Finger;
    className?: string;
    animated?: boolean;
}

export default function HandFigure({ pose, highlight, className, animated = true }: IHandFigureProps)
{
    const transition = animated ? TRANSITION : { duration: 0 };
    const digits = (Object.keys(DIGITS) as Exclude<Finger, "thumb">[]).map(name => ({ name, ...finger(DIGITS[name], pose[name]) }));
    const thumbPath = thumb(pose.thumb);
    const tone = (name: Finger) => name === highlight ? styles.lit : styles.skin;

    return (
        <svg className={`${styles.hand} ${className ?? ""}`} viewBox="4 -6 118 176" aria-hidden="true">
            <g className={styles.outline}>
                {digits.map(digit => <motion.path key={digit.name} initial={false} animate={{ d: digit.back }} transition={transition} />)}
                <motion.path initial={false} animate={{ d: thumbPath }} transition={transition} />
                <path d={WRIST} />
                <path d={PALM} />
            </g>
            <path className={styles.palm} d={WRIST} />
            <motion.path className={tone("thumb")} initial={false} animate={{ d: thumbPath }} transition={transition} />
            {digits.map(digit => (
                <motion.path key={digit.name} className={tone(digit.name)} initial={false} animate={{ d: digit.back }} transition={transition} />
            ))}
            <path className={styles.palm} d={PALM} />
            <path className={styles.cuff} d="M45,141 L86,141" />
            {digits.map(digit => (
                <motion.path
                    key={digit.name}
                    className={styles.crease}
                    d={crease(DIGITS[digit.name].knuckle[0], DIGITS[digit.name].knuckle[1])}
                    initial={false}
                    animate={{ opacity: digit.folded > 0.05 ? 0 : 1 }}
                    transition={transition}
                />
            ))}
            {digits.map(digit => (
                <motion.path
                    key={digit.name}
                    className={`${styles.fold} ${tone(digit.name)}`}
                    initial={false}
                    animate={{ d: digit.fold, opacity: digit.folded > 0.05 ? 1 : 0 }}
                    transition={transition}
                />
            ))}
        </svg>
    );
}
