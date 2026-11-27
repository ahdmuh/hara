import { AnimatePresence, motion } from "motion/react";
import { EASE } from "./Motion";
import styles from "./Rolling.module.css";

export default function Rolling({ text, className }: { text: string; className?: string })
{
    return (
        <span className={`${styles.rolling} ${className ?? ""}`} aria-label={text}>
            {[...text].map((character, index) => (
                <span key={index} className={styles.slot} aria-hidden="true">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={character}
                            className={styles.character}
                            initial={{ y: "70%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            exit={{ y: "-70%", opacity: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}
                        >
                            {character}
                        </motion.span>
                    </AnimatePresence>
                </span>
            ))}
        </span>
    );
}
