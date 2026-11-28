import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./AutoHeight.module.css";
import { EASE } from "./Motion";

export default function AutoHeight({ className, children }: { className?: string; children: ReactNode })
{
    const inner = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | "auto">("auto");

    useLayoutEffect(() =>
    {
        const element = inner.current;
        if (!element)
        {
            return;
        }
        const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <motion.div className={`${styles.outer} ${className ?? ""}`} initial={false} animate={{ height }} transition={{ duration: 0.28, ease: EASE }}>
            <div ref={inner}>{children}</div>
        </motion.div>
    );
}
