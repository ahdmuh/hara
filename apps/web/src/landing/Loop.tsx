import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE } from "../ui/Motion";
import Reveal from "../ui/Reveal";
import styles from "./Loop.module.css";

const STAGES = [
    {
        word: "Calibrate",
        body: "A short calibration measures the range and strength of each finger and sets the safe limits every game stays within.",
    },
    {
        word: "Play",
        body: "Games turn repetitive exercises into play, and their difficulty scales to your capacity as you recover.",
    },
    {
        word: "Track",
        body: "Each session is saved and synced to your account, where your clinician follows your trends and milestones.",
    },
];

const STAGE_MILLISECONDS = 4200;

export default function Loop()
{
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const running = inView && !paused;

    useEffect(() =>
    {
        if (!running)
        {
            return;
        }
        const timer = window.setTimeout(() => setActive(current => (current + 1) % STAGES.length), STAGE_MILLISECONDS);
        return () => window.clearTimeout(timer);
    }, [running, active]);

    const stage = STAGES[active] ?? STAGES[0];

    return (
        <Reveal className={styles.loop}>
            <div ref={ref} onPointerEnter={event => setPaused(event.pointerType === "mouse")} onPointerLeave={() => setPaused(false)}>
                <div className={styles.words} role="tablist" aria-label="How a Session Works">
                    {STAGES.map((entry, index) => (
                        <button
                            key={entry.word}
                            type="button"
                            role="tab"
                            aria-selected={active === index}
                            className={`${styles.word} ${active === index ? styles.current : ""}`}
                            onClick={() => setActive(index)}
                            onFocus={() => setPaused(true)}
                            onBlur={() => setPaused(false)}
                        >
                            {entry.word}
                            <span className={styles.stop}>.</span>
                            <span className={styles.track} aria-hidden="true">
                                {active === index && (
                                    <motion.span
                                        key={`${index}-${running}`}
                                        className={styles.fill}
                                        initial={{ scaleX: running ? 0 : 1 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: running ? STAGE_MILLISECONDS / 1000 : 0.3, ease: "linear" }}
                                    />
                                )}
                            </span>
                        </button>
                    ))}
                </div>
                <div className={styles.stage} role="tabpanel" aria-live="polite">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                            key={stage?.word}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                            exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: EASE } }}
                        >
                            {stage?.body}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </Reveal>
    );
}
