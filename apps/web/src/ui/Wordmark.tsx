import { motion } from "motion/react";
import { EASE } from "./Motion";
import styles from "./Wordmark.module.css";

const LETTERS = ["H", "A", "R", "A"];

interface IWordmarkProps
{
    className?: string;
    animate?: boolean;
    delay?: number;
}

export default function Wordmark({ className, animate = false, delay = 0 }: IWordmarkProps)
{
    if (!animate)
    {
        return <span className={`${styles.wordmark} ${className ?? ""}`}>HARA</span>;
    }
    return (
        <span className={`${styles.wordmark} ${className ?? ""}`} aria-label="HARA">
            {LETTERS.map((letter, index) => (
                <motion.span
                    key={index}
                    aria-hidden="true"
                    className={styles.letter}
                    initial={{ opacity: 0, y: "0.35em", filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
                    transition={{ duration: 1.2, delay: delay + index * 0.1, ease: EASE }}
                >
                    {letter}
                </motion.span>
            ))}
        </span>
    );
}
