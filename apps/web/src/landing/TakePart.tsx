import { motion } from "motion/react";
import { Mail } from "../ui/Icons";
import { LinkButton } from "../ui/Button";
import { EASE } from "../ui/Motion";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./TakePart.module.css";

export const CONTACT_EMAIL = "contact@projecthara.ca";

const SESSION = [
    { label: "Calibration", minutes: 15 },
    { label: "Play", minutes: 10 },
    { label: "Break", minutes: 5 },
    { label: "Play", minutes: 10 },
    { label: "Break", minutes: 5 },
    { label: "Play", minutes: 10 },
];

const ELIGIBILITY = [
    "You are a stroke survivor",
    "You are 18 years or older",
    "You can attend the full session at the University of Calgary",
];

export default function TakePart()
{
    return (
        <section className={styles.section} id="take-part">
            <div className={styles.panel}>
                <Reveal className={styles.intro} group>
                    <RevealItem as="header">
                        <h2>Take Part in Our Study</h2>
                    </RevealItem>
                    <RevealItem>
                        <p>
                            We are looking for stroke survivors with hand dysfunction to help validate our design by playing our games.
                            Snacks and drinks are included.
                        </p>
                    </RevealItem>
                    <RevealItem className={styles.cta}>
                        <LinkButton to={`mailto:${CONTACT_EMAIL}`} size="large" icon={<Mail />}>Contact Us</LinkButton>
                    </RevealItem>
                </Reveal>
                <Reveal className={styles.details} group>
                    <RevealItem className={styles.block}>
                        <h3>
                            <span className={styles.minutes}>60</span>
                            Minute Session
                        </h3>
                        <ol className={styles.timeline} aria-label="Session Plan">
                            {SESSION.map((part, index) => (
                                <motion.li
                                    key={index}
                                    className={styles[part.label.toLowerCase()]}
                                    style={{ flexGrow: part.minutes }}
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, delay: 0.2 + index * 0.08, ease: EASE }}
                                >
                                    <span>{part.label}</span>
                                    <small>
                                        {part.minutes}
                                        {" "}
                                        min
                                    </small>
                                </motion.li>
                            ))}
                        </ol>
                    </RevealItem>
                    <RevealItem className={styles.block}>
                        <h3>Who Can Take Part</h3>
                        <ul className={styles.list}>
                            {ELIGIBILITY.map(item => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </RevealItem>
                </Reveal>
            </div>
        </section>
    );
}
