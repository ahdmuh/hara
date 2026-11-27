import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import styles from "./Tooltip.module.css";

interface ITooltipProps
{
    label: ReactNode;
    children: ReactNode;
    className?: string;
}

export default function Tooltip({ label, children, className }: ITooltipProps)
{
    const id = useId();
    const [open, setOpen] = useState(false);
    return (
        <span
            className={`${styles.anchor} ${className ?? ""}`}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            aria-describedby={open ? id : undefined}
        >
            {children}
            <AnimatePresence>
                {open && (
                    <motion.span
                        id={id}
                        role="tooltip"
                        className={styles.tip}
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } }}
                        exit={{ opacity: 0, y: 2, scale: 0.98, transition: { duration: 0.1 } }}
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}
