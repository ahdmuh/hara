import { motion } from "motion/react";
import { EASE } from "./Motion";
import styles from "./Wordmark.module.css";

const LETTERS = ["H", "A", "R", "A"];

interface IWordmarkProps
{
    className?: string;
    animate?: boolean;
    delay?: number;
    trademark?: boolean;
}

export default function Wordmark({ className, animate = false, delay = 0, trademark = true }: IWordmarkProps)
{
    const mark = trademark && <span className={styles.trademark} aria-hidden="true">TM</span>;
    if (!animate)
    {
        return (
            <span className={`${styles.wordmark} ${className ?? ""}`}>
                HARA
                {mark}
            </span>
        );
    }
    return (
        <span className={`${styles.wordmark} ${className ?? ""}`} aria-label="HARA">
            {LETTERS.map((letter, index) => (
                <motion.span
                    key={index}
                    aria-hidden="true"
                    className={styles.letter}
                    initial={{ opacity: 0, y: "0.3em" }}
                    animate={{ opacity: 1, y: "0em" }}
                    transition={{ duration: 1, delay: delay + index * 0.09, ease: EASE }}
                >
                    {letter}
                </motion.span>
            ))}
            {mark}
        </span>
    );
}
