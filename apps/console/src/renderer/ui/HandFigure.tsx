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

const PIVOT: [number, number] = [62, 108];

function radial(angle: number, radius: number, length: number, base: number, tip: number): IDigit
{
    const radians = (angle * Math.PI) / 180;
    return { knuckle: [PIVOT[0] + Math.sin(radians) * radius, PIVOT[1] - Math.cos(radians) * radius], angle, length, base, tip };
}

const DIGITS: Record<Exclude<Finger, "thumb">, IDigit> = {
    pinky: radial(-44, 30, 54, 16, 18),
    ring: radial(-19, 33, 68, 17, 19),
    middle: radial(3, 34, 74, 17, 19),
    index: radial(25, 32, 66, 17, 19),
};

const THUMB: IDigit = radial(76, 26, 52, 23, 19);

const PALM = "M62,72 C84,72 98,90 98,110 C98,130 86,146 62,146 C40,146 27,130 27,110 C27,88 41,72 62,72 Z";

const WRIST = "M48,138 L48,160 C48,163.5 50.5,166 54,166 L72,166 C75.5,166 78,163.5 78,160 L78,138 Z";

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
    const angle = (digit.angle - 2) * (0.62 + pose.spread * 0.38) + 2;
    const back = capsule(digit.knuckle[0], digit.knuckle[1], angle, digit.length * (1 - 0.8 * pose.curl), digit.base, digit.tip);
    const folded = clamp((pose.curl - 0.35) / 0.65);
    const reach = Math.max(digit.tip, digit.length * 0.55 * folded);
    const fold = capsule(digit.knuckle[0], digit.knuckle[1] + 2, angle + 180, reach, digit.tip + 1, digit.tip);
    return { back, fold, folded };
}

function thumb(pose: IFingerPose): string
{
    const angle = THUMB.angle + 10 * pose.spread - 58 * pose.curl;
    return capsule(THUMB.knuckle[0], THUMB.knuckle[1], angle, THUMB.length * (1 - 0.22 * pose.curl), THUMB.base, THUMB.tip);
}

export function tipOf(name: Finger, pose: IFingerPose): [number, number]
{
    const digit = name === "thumb" ? THUMB : DIGITS[name];
    const angle = name === "thumb" ? THUMB.angle + 10 * pose.spread - 58 * pose.curl : (digit.angle - 2) * (0.62 + pose.spread * 0.38) + 2;
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
        <svg className={`${styles.hand} ${className ?? ""}`} viewBox="-8 -18 156 190" aria-hidden="true">
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
