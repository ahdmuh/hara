import type { Transition, Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };

export const RISE: Variants = {
    hidden: { opacity: 0, y: 24 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
    gone: { opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE } },
};

export const STAGGER: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
    gone: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

export const PAGE: Variants = {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: 0.35, ease: EASE } },
    gone: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
};

export const PRESS = { scale: 0.97 };
