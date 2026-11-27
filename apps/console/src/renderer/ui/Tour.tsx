import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useIntent } from "../Intents";
import Hints from "./Hints";
import { EASE, SPRING } from "./Motion";
import styles from "./Tour.module.css";

export interface ITourStep
{
    target: string;
    title: string;
    body: string;
}

interface IBox
{
    left: number;
    top: number;
    width: number;
    height: number;
}

const PADDING = 14;
const CARD_WIDTH = 340;

function measure(target: string): IBox | null
{
    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!element)
    {
        return null;
    }
    const rect = element.getBoundingClientRect();
    return { left: rect.left - PADDING, top: rect.top - PADDING, width: rect.width + PADDING * 2, height: rect.height + PADDING * 2 };
}

export default function Tour({ steps, onDone }: { steps: ITourStep[]; onDone: () => void })
{
    const [index, setIndex] = useState(0);
    const [box, setBox] = useState<IBox | null>(null);
    const step = steps[index] ?? steps[0];

    useLayoutEffect(() =>
    {
        const update = () => setBox(step ? measure(step.target) : null);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [step]);

    useEffect(() =>
    {
        const timer = window.setTimeout(() => setBox(step ? measure(step.target) : null), 400);
        return () => window.clearTimeout(timer);
    }, [step]);

    useIntent((intent) =>
    {
        if (intent === "select" || intent === "next")
        {
            if (index === steps.length - 1)
            {
                onDone();
            }
            else
            {
                setIndex(index + 1);
            }
            return true;
        }
        if (intent === "previous" && index > 0)
        {
            setIndex(index - 1);
            return true;
        }
        if (intent === "back")
        {
            onDone();
            return true;
        }
        return true;
    });

    if (!box || !step)
    {
        return null;
    }

    const below = box.top + box.height + 220 < window.innerHeight;
    const cardLeft = Math.min(window.innerWidth - CARD_WIDTH - 24, Math.max(24, box.left + box.width / 2 - CARD_WIDTH / 2));
    const cardTop = below ? box.top + box.height + 18 : box.top - 18;

    return (
        <motion.div
            className={styles.tour}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
        >
            <motion.div
                className={styles.spotlight}
                initial={false}
                animate={{ left: box.left, top: box.top, width: box.width, height: box.height }}
                transition={SPRING}
            />
            <motion.div
                className={styles.card}
                style={{ width: CARD_WIDTH }}
                initial={false}
                animate={{ left: cardLeft, top: cardTop, y: below ? 0 : "-100%" }}
                transition={SPRING}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={step.target}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: EASE }}
                    >
                        <strong>{step.title}</strong>
                        <p>{step.body}</p>
                    </motion.div>
                </AnimatePresence>
                <div className={styles.footer}>
                    <ol className={styles.dots}>
                        {steps.map((entry, position) => <li key={entry.target} className={position === index ? styles.on : ""} />)}
                    </ol>
                    <Hints
                        hints={[
                            { finger: "middle", key: "Enter", label: index === steps.length - 1 ? "Done" : "Next" },
                            { finger: "thumb", key: "Esc", label: "Skip" },
                        ]}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
