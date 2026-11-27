import { motion, useAnimationFrame, useInView, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Fingers.module.css";

const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const DOTS = 14;
const IDLE_MILLISECONDS = 2600;

interface ITrackProps
{
    name: string;
    index: number;
    pressed: boolean;
    idle: boolean;
    onPress: (index: number, pressed: boolean) => void;
}

function Track({ name, index, pressed, idle, onPress }: ITrackProps)
{
    const level = useSpring(0, { stiffness: 180, damping: 22, mass: 0.6 });
    const percent = useTransform(level, value => `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}`);

    useAnimationFrame((time) =>
    {
        if (pressed)
        {
            level.set(1);
        }
        else if (idle)
        {
            level.set(0.5 + 0.38 * Math.sin(time / 520 - index * 0.75));
        }
        else
        {
            level.set(0);
        }
    });

    return (
        <div className={`${styles.track} ${pressed ? styles.pressed : ""}`}>
            <motion.span className={styles.readout} aria-hidden="true">{percent}</motion.span>
            <motion.button
                type="button"
                className={styles.rail}
                style={{ "--level": level } as unknown as CSSProperties}
                aria-label={`Flex ${name}`}
                aria-pressed={pressed}
                onPointerDown={(event) =>
                {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    onPress(index, true);
                }}
                onPointerUp={() => onPress(index, false)}
                onPointerCancel={() => onPress(index, false)}
                onKeyDown={(event) =>
                {
                    if (event.key === " " || event.key === "Enter")
                    {
                        event.preventDefault();
                        onPress(index, true);
                    }
                }}
                onKeyUp={() => onPress(index, false)}
                onBlur={() => onPress(index, false)}
            >
                {Array.from({ length: DOTS }, (_, dot) => (
                    <span key={dot} className={styles.dot} style={{ "--i": dot } as CSSProperties} />
                ))}
            </motion.button>
            <span className={styles.name}>
                <kbd>{index + 1}</kbd>
                {name}
            </span>
        </div>
    );
}

export default function Fingers()
{
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
    const [pressed, setPressed] = useState<boolean[]>(() => FINGERS.map(() => false));
    const [idle, setIdle] = useState(true);
    const idleTimer = useRef(0);

    function press(index: number, down: boolean): void
    {
        setPressed(current => current.map((value, finger) => (finger === index ? down : value)));
        setIdle(false);
        window.clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MILLISECONDS);
    }

    useEffect(() =>
    {
        if (!inView)
        {
            return;
        }
        function handle(event: KeyboardEvent): void
        {
            const index = Number(event.key) - 1;
            if (event.repeat || !Number.isInteger(index) || index < 0 || index >= FINGERS.length || event.target instanceof HTMLInputElement)
            {
                return;
            }
            press(index, event.type === "keydown");
        }
        window.addEventListener("keydown", handle);
        window.addEventListener("keyup", handle);
        return () =>
        {
            window.removeEventListener("keydown", handle);
            window.removeEventListener("keyup", handle);
        };
    }, [inView]);

    useEffect(() => () => window.clearTimeout(idleTimer.current), []);

    return (
        <div ref={ref} className={styles.fingers}>
            <Reveal className={styles.copy} group>
                <RevealItem as="header">
                    <h2>Every Finger, on Its Own</h2>
                </RevealItem>
                <RevealItem>
                    <p>
                        HARA measures the position and force of each finger, and can assist or resist all five independently,
                        always within the limits set by your calibration.
                    </p>
                </RevealItem>
                <RevealItem>
                    <p className={styles.hint}>Hold 1 to 5, or press and hold a finger.</p>
                </RevealItem>
            </Reveal>
            <Reveal as="ul" className={styles.board} group>
                {FINGERS.map((name, index) => (
                    <RevealItem as="li" key={name} className={styles.slot}>
                        <Track name={name} index={index} pressed={pressed[index] ?? false} idle={idle} onPress={press} />
                    </RevealItem>
                ))}
            </Reveal>
        </div>
    );
}
