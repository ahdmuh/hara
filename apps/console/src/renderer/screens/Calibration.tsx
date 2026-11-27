import { CalibrationRecorder, FINGERS, type Finger, type HandCalibration, type IHandFrame, type IRawFinger } from "@hara/input";
import type { IRawSource } from "../DeviceSource";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useInputSource } from "../InputContext";
import { useIntent } from "../Intents";
import { TapDetector } from "../TapDetector";
import { Check } from "../ui/Icons";
import HandDemo, { type HandAction } from "../ui/HandDemo";
import HandGlyph from "../ui/HandGlyph";
import Hints from "../ui/Hints";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./Calibration.module.css";

const HOLD_SECONDS = 2;
const TAP_GOAL = 10;

type StepCheck = (frame: IHandFrame) => boolean;

function most(frame: IHandFrame, test: (position: number, force: number) => boolean): boolean
{
    return FINGERS.filter(finger => test(frame.fingers[finger].position, frame.fingers[finger].force)).length >= 3;
}

const STEPS: { id: HandAction; title: string; note: string; check?: StepCheck }[] = [
    { id: "open", title: "Open Your Hand", note: "Spread every finger as wide as you comfortably can, then hold.", check: frame => most(frame, position => position <= -0.6) },
    { id: "relax", title: "Let Your Hand Rest", note: "Relax your fingers and let them settle.", check: frame => most(frame, position => Math.abs(position) <= 0.2) },
    { id: "fist", title: "Make a Fist", note: "Close every finger as far as you comfortably can, then hold.", check: frame => most(frame, position => position >= 0.7) },
    { id: "push", title: "Push Against the Device", note: "Press each finger as hard as feels comfortable, then hold.", check: frame => most(frame, (_, force) => force >= 0.6) },
    { id: "tap", title: "Tap Quickly", note: `Tap your fingers as fast as you can, ${TAP_GOAL} taps in total.` },
];

interface ICalibrationProps
{
    raw: IRawSource;
    onDone: (calibration: HandCalibration | null) => void;
}

export default function Calibration({ raw, onDone }: ICalibrationProps)
{
    const source = useInputSource();
    const [recorder] = useState(() => new CalibrationRecorder());
    const [index, setIndex] = useState(0);
    const bars = useRef<(HTMLSpanElement | null)[]>([]);
    const ring = useRef<HTMLSpanElement>(null);
    const finished = index >= STEPS.length;
    const step = STEPS[index];

    useIntent((intent) =>
    {
        if (intent !== "select")
        {
            return false;
        }
        if (finished)
        {
            onDone(recorder.result());
        }
        else
        {
            setIndex(index + 1);
        }
        return true;
    });

    useEffect(() =>
    {
        if (!step)
        {
            return;
        }
        let progress = 0;
        let taps = 0;
        let previous = 0;
        let complete = false;
        let latest: Record<Finger, IRawFinger> | null = null;
        let tapStart = 0;
        const detector = new TapDetector();
        const stopRaw = raw.subscribe((reading) =>
        {
            latest = reading;
        });
        const stopFrames = source.subscribe((frame) =>
        {
            FINGERS.forEach((finger, position) =>
            {
                const bar = bars.current[position];
                const state = frame.fingers[finger];
                if (bar)
                {
                    bar.style.transform = `scaleY(${(state.position + 1) / 2})`;
                    bar.style.opacity = `${0.55 + state.force * 0.45}`;
                }
            });
            const seconds = previous ? Math.min(0.1, (frame.timestamp - previous) / 1000) : 0;
            previous = frame.timestamp;
            if (step.check)
            {
                const holding = step.check(frame);
                if (holding && latest && step.id !== "tap" && !complete)
                {
                    recorder.record(step.id, latest);
                }
                progress = holding ? progress + seconds / HOLD_SECONDS : Math.max(0, progress - seconds);
            }
            else
            {
                const tapped = detector.update(frame);
                if (tapped.length && !tapStart)
                {
                    tapStart = frame.timestamp;
                }
                tapped.forEach(finger => recorder.tap(finger));
                taps += tapped.length;
                progress = taps / TAP_GOAL;
                if (progress >= 1 && !complete)
                {
                    recorder.tapDuration(Math.max(0.5, (frame.timestamp - tapStart) / 1000));
                }
            }
            progress = Math.min(1, progress);
            if (ring.current)
            {
                ring.current.style.transform = `scaleX(${progress})`;
            }
            if (progress >= 1 && !complete)
            {
                complete = true;
                window.setTimeout(() => setIndex(current => current + 1), 500);
            }
        });
        return () =>
        {
            stopRaw();
            stopFrames();
        };
    }, [source, raw, recorder, step]);

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
                <span className={styles.count}>{finished ? "Complete" : `Step ${index + 1} of ${STEPS.length}`}</span>
            </div>
            <div className={styles.stage}>
                <AnimatePresence mode="wait" initial={false}>
                    {step
                        ? (
                                <motion.div
                                    key={step.id}
                                    className={styles.step}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }}
                                    exit={{ opacity: 0, y: -10, transition: { duration: 0.25, ease: EASE } }}
                                >
                                    <div className={screen.heading}>
                                        <h1>{step.title}</h1>
                                        <p>{step.note}</p>
                                    </div>
                                    <span className={styles.hold} aria-hidden="true">
                                        <span ref={ring} className={styles.meter} />
                                    </span>
                                    <div className={styles.visual}>
                                        <HandDemo action={step.id} />
                                    </div>
                                </motion.div>
                            )
                        : (
                                <motion.div
                                    key="done"
                                    className={styles.done}
                                    initial={{ opacity: 0, scale: 0.94 }}
                                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } }}
                                >
                                    <span className={styles.check}><Check /></span>
                                    <div className={screen.heading}>
                                        <h1>Calibration Complete</h1>
                                        <p>Every game will now stay within the limits of your hand.</p>
                                    </div>
                                </motion.div>
                            )}
                </AnimatePresence>
                <ul className={`${styles.fingers} ${finished ? styles.rest : ""}`} aria-hidden="true">
                    {FINGERS.map((finger, position) => (
                        <li key={finger}>
                            <span className={styles.column}>
                                <span
                                    ref={(element) =>
                                    {
                                        bars.current[position] = element;
                                    }}
                                    className={styles.bar}
                                />
                            </span>
                            <span className={styles.finger}>{finger}</span>
                            <HandGlyph finger={finger} />
                        </li>
                    ))}
                </ul>
            </div>
            <div className={screen.foot}>
                <Hints hints={[{ finger: "middle", key: "Enter", label: finished ? "Continue" : "Skip" }]} />
            </div>
        </div>
    );
}
