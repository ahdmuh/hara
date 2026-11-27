import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE } from "../ui/Motion";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./About.module.css";
import Apparatus from "./Apparatus";
import Loop from "./Loop";

function Percent()
{
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
    const value = useMotionValue(0);
    const text = useTransform(value, current => Math.round(current).toString());

    useEffect(() =>
    {
        if (!inView)
        {
            return;
        }
        const controls = animate(value, 75, { duration: 1.8, ease: EASE });
        return () => controls.stop();
    }, [inView, value]);

    return (
        <span ref={ref} className={styles.percent}>
            <motion.span>{text}</motion.span>
            <small>%</small>
        </span>
    );
}

export default function About()
{
    return (
        <section className={styles.about} id="about">
            <Reveal className={styles.statement} group>
                <RevealItem className={styles.figure}>
                    <Percent />
                </RevealItem>
                <RevealItem className={styles.claim}>
                    <p className={styles.big}>
                        of stroke survivors live with some form of hand dysfunction.
                    </p>
                    <p className={styles.cite}>Fardipour and Hadadi, 2022</p>
                </RevealItem>
            </Reveal>
            <Reveal className={styles.problem}>
                <p>
                    Recovery takes repetition, and without engagement or motivation the chances of success drop significantly.
                    <span>
                        {" HARA pairs precise tracking with games that adjust to each patient's abilities, reward progress, "}
                        and can be played wherever the patient feels comfortable.
                    </span>
                </p>
            </Reveal>
            <Apparatus />
            <Loop />
        </section>
    );
}
