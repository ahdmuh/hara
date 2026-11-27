import { FINGERS, type Finger } from "@hara/input";
import { AnimatePresence, motion } from "motion/react";
import { useInputMode } from "../Intents";
import Keycap from "./Keycap";
import { EASE } from "./Motion";
import styles from "./Hints.module.css";

export interface IHint
{
    finger?: Finger;
    key: string;
    label: string;
}

const DOTS = [
    { x: 4, y: 15 },
    { x: 9, y: 6 },
    { x: 15, y: 3 },
    { x: 21, y: 6 },
    { x: 26, y: 12 },
];

function Hand({ finger }: { finger: Finger })
{
    return (
        <svg className={styles.hand} viewBox="0 0 30 20" aria-label={`${finger} finger`}>
            {DOTS.map((dot, index) => (
                <circle key={index} cx={dot.x} cy={dot.y} r="2.6" className={FINGERS[index] === finger ? styles.on : styles.off} />
            ))}
        </svg>
    );
}

export default function Hints({ hints }: { hints: IHint[] })
{
    const mode = useInputMode();
    return (
        <ul className={styles.hints} aria-label="Controls">
            <AnimatePresence mode="popLayout" initial={false}>
                {hints.map(hint => (
                    <motion.li
                        key={`${hint.key}-${hint.label}`}
                        layout
                        className={styles.hint}
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.9 }}
                        transition={{ duration: 0.35, ease: EASE }}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={mode === "hand" && hint.finger ? "hand" : "key"}
                                className={styles.glyph}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.3, ease: EASE }}
                            >
                                {mode === "hand" && hint.finger ? <Hand finger={hint.finger} /> : <Keycap label={hint.key} />}
                            </motion.span>
                        </AnimatePresence>
                        <span>{hint.label}</span>
                    </motion.li>
                ))}
            </AnimatePresence>
        </ul>
    );
}
