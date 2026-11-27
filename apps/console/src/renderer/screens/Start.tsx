import { AnimatePresence, motion } from "motion/react";
import { useInputMode, useIntent } from "../Intents";
import Hints from "../ui/Hints";
import Keycap from "../ui/Keycap";
import { EASE } from "../ui/Motion";
import Status from "../ui/Status";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./Start.module.css";

const LATE = { duration: 0.8, delay: 1.3, ease: EASE };

interface IStartProps
{
    connected: boolean;
    version: string;
    returning: boolean;
    onStart: () => void;
}

export default function Start({ connected, version, returning, onStart }: IStartProps)
{
    const mode = useInputMode();
    useIntent((intent) =>
    {
        if (returning ? intent !== "back" : intent === "select")
        {
            onStart();
            return true;
        }
        return false;
    });

    return (
        <div className={screen.screen} onClick={onStart}>
            <motion.div className={screen.top} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={LATE}>
                <span />
                <Status connected={connected} />
            </motion.div>
            <div className={styles.center}>
                <h1 className={styles.mark}>
                    <Wordmark animate delay={0.15} />
                </h1>
                <motion.p
                    className={styles.press}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
                >
                    <span className={styles.prompt}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={returning && mode === "hand" ? "hand" : "keyboard"}
                                className={styles.words}
                                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                                transition={{ duration: 0.4, ease: EASE }}
                            >
                                {returning && mode === "hand"
                                    ? "Tap Any Finger to Start"
                                    : (
                                            <>
                                                Press
                                                <Keycap label="Enter" large />
                                                {returning ? "to Start" : "to Set Up"}
                                            </>
                                        )}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </motion.p>
            </div>
            <motion.div className={styles.foot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={LATE}>
                <Hints hints={[returning ? { finger: "middle", key: "Enter", label: "Start" } : { key: "Enter", label: "Set Up" }]} />
                <span className={styles.version}>{version && `Version ${version}`}</span>
            </motion.div>
        </div>
    );
}
