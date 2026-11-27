import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE } from "../ui/Motion";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./About.module.css";
import Fingers from "./Fingers";

const PRINCIPLES = [
    {
        title: "Nothing Electronic on the Hand",
        body: "Motors and sensors sit in the tabletop base. Magnetic fingertip cuffs let go under abnormal stress or position.",
    },
    {
        title: "Calibrated to You",
        body: "Calibration sets safe force and range limits for each finger, and every game scales to your capacity.",
    },
    {
        title: "Progress Your Clinician Can See",
        body: "Each session is saved and synced to your account, where your clinician follows your trends and milestones.",
    },
];

const TARGETS = [
    { sign: "≤", value: "100", unit: "ms", label: "Sensor to Screen" },
    { sign: "≥", value: "100", unit: "Hz", label: "Sample Rate" },
    { sign: "±", value: "5", unit: "%", label: "Position Accuracy" },
    { sign: "±", value: "10", unit: "%", label: "Force Accuracy" },
];

function Percent()
{
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
    const value = useMotionValue(0);
    const text = useTransform(value, current => `${Math.round(current)}%`);

    useEffect(() =>
    {
        if (!inView)
        {
            return;
        }
        const controls = animate(value, 75, { duration: 1.8, ease: EASE });
        return () => controls.stop();
    }, [inView, value]);

    return <motion.span ref={ref} className={styles.percent}>{text}</motion.span>;
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
            <Fingers />
            <Reveal as="ul" className={styles.principles} group>
                {PRINCIPLES.map((principle, index) => (
                    <RevealItem as="li" key={principle.title} className={styles.principle}>
                        <span className={styles.index}>{`0${index + 1}`}</span>
                        <h3>{principle.title}</h3>
                        <p>{principle.body}</p>
                    </RevealItem>
                ))}
            </Reveal>
            <Reveal className={styles.targets}>
                <h2>Design Targets</h2>
                <ul>
                    {TARGETS.map(target => (
                        <li key={target.label}>
                            <span className={styles.value}>
                                <span className={styles.sign}>{target.sign}</span>
                                {target.value}
                                <small>{target.unit}</small>
                            </span>
                            <span className={styles.label}>{target.label}</span>
                        </li>
                    ))}
                </ul>
            </Reveal>
        </section>
    );
}
