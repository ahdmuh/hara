import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useIntent } from "../Intents";
import Hints from "./Hints";
import { EASE } from "./Motion";
import styles from "./Tour.module.css";

export interface ITourStep
{
    target: string;
    title: string;
    body: string;
    padding?: number;
    round?: boolean;
}

interface IBox
{
    left: number;
    top: number;
    width: number;
    height: number;
}

const PADDING = 14;
const GLIDE = { duration: 0.7, ease: [0.22, 1, 0.36, 1] } as const;
const CARD_WIDTH = 340;

function measure(target: string, padding = PADDING): IBox | null
{
    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!element)
    {
        return null;
    }
    const rects = [element, ...element.querySelectorAll("*")].map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    const left = Math.min(...rects.map(rect => rect.left));
    const top = Math.min(...rects.map(rect => rect.top));
    const right = Math.max(...rects.map(rect => rect.right));
    const bottom = Math.max(...rects.map(rect => rect.bottom));
    return { left: left - padding, top: top - padding, width: right - left + padding * 2, height: bottom - top + padding * 2 };
}

export default function Tour({ steps, onDone }: { steps: ITourStep[]; onDone: () => void })
{
    const [index, setIndexState] = useState(0);
    const [direction, setDirection] = useState(1);

    function setIndex(next: number): void
    {
        setDirection(next >= index ? 1 : -1);
        setIndexState(next);
    }
    const [box, setBox] = useState<IBox | null>(null);
    const step = steps[index] ?? steps[0];

    useLayoutEffect(() =>
    {
        const update = () => setBox(step ? measure(step.target, step.padding) : null);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [step]);

    useEffect(() =>
    {
        const timer = window.setTimeout(() => setBox(step ? measure(step.target, step.padding) : null), 400);
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
                animate={{ left: box.left, top: box.top, width: box.width, height: box.height, borderRadius: step.round ? box.height / 2 : 24 }}
                transition={GLIDE}
            />
            <motion.div
                className={styles.card}
                style={{ width: CARD_WIDTH }}
                initial={false}
                animate={{ left: cardLeft, top: cardTop, y: below ? 0 : "-100%" }}
                transition={GLIDE}
            >
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={step.target}
                        custom={direction}
                        variants={{
                            enter: (sign: number) => ({ opacity: 0, x: sign * 18, filter: "blur(3px)" }),
                            center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, delay: 0.12, ease: EASE } },
                            leave: (sign: number) => ({ opacity: 0, x: sign * -18, filter: "blur(3px)", transition: { duration: 0.3, ease: EASE } }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="leave"
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
