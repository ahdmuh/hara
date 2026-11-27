import { motion } from "motion/react";
import { useState } from "react";
import { SPRING } from "./Motion";
import styles from "./Ring.module.css";

function pixels(rem: number): number
{
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export default function Ring({ id, radius, tone = "accent" }: { id: string; radius: number; tone?: "accent" | "danger" })
{
    const [unit] = useState(() => pixels(1));
    const color = tone === "danger" ? "214, 69, 69" : "10, 132, 255";
    const width = Math.round(unit * 0.2);
    const glow = Math.round(unit * 1.6);
    const spread = Math.round(unit * -0.2);
    return (
        <motion.span
            layoutId={id}
            className={styles.ring}
            initial={false}
            style={{ borderRadius: radius * unit }}
            animate={{ boxShadow: `0 0 0 ${width}px rgba(${color}, 1), 0 0 ${glow}px ${spread}px rgba(${color}, 0.32)` }}
            transition={SPRING}
        />
    );
}
