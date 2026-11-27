import type { Transition, Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const SPRING: Transition = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 };

export interface ITravel
{
    x: number;
    mode: "slide" | "zoom" | "dive" | "surface";
}

const SOFT = [0.16, 1, 0.3, 1] as const;

export const SCREEN: Variants = {
    hidden: ({ x, mode }: ITravel) =>
    {
        switch (mode)
        {
            case "zoom":
                return { opacity: 0, x: "0%", scale: 1.16, filter: "blur(0px)" };
            case "dive":
                return { opacity: 0, x: "0%", scale: 1, filter: "blur(0px)" };
            case "surface":
                return { opacity: 0, x: "0%", scale: 1.04, filter: "blur(0px)" };
            default:
                return { opacity: 0, x: `${x * 8}%`, scale: 0.97, filter: "blur(0px)" };
        }
    },
    shown: ({ mode }: ITravel) => ({
        opacity: 1,
        x: "0%",
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: mode === "zoom" ? 1.25 : mode === "slide" ? 0.6 : 0.8, ease: mode === "slide" ? EASE : SOFT },
    }),
    gone: ({ x, mode }: ITravel) =>
    {
        switch (mode)
        {
            case "zoom":
                return { opacity: 0, scale: 0.9, transition: { duration: 0.55, ease: [0.4, 0, 0.6, 1] } };
            case "dive":
                return { opacity: 0, scale: 1.12, transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] } };
            case "surface":
                return { opacity: 0, filter: "blur(16px)", transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] } };
            default:
                return { opacity: 0, x: `${x * -8}%`, scale: 0.97, transition: { duration: 0.32, ease: EASE } };
        }
    },
};

export const DOCK: Variants = {
    hidden: { y: "100%" },
    shown: { y: "0%", transition: { duration: 0.6, delay: 0.1, ease: SOFT } },
    gone: { y: "100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};
