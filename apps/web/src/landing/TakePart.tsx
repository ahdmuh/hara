import { motion } from "motion/react";
import { LinkButton } from "../ui/Button";
import { Mail } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import Reveal from "../ui/Reveal";
import UCalgary from "../ui/UCalgary";
import styles from "./TakePart.module.css";

export const CONTACT_EMAIL = "contact@projecthara.ca";

const SESSION = [
    { label: "Calibration", minutes: 15, kind: "calibration" },
    { label: "Play", minutes: 10, kind: "play" },
    { label: "Break", minutes: 5, kind: "rest" },
    { label: "Play", minutes: 10, kind: "play" },
    { label: "Break", minutes: 5, kind: "rest" },
    { label: "Play", minutes: 10, kind: "play" },
] as const;

export default function TakePart()
{
    return (
        <section className={styles.section} id="take-part">
            <Reveal className={styles.pamphlet}>
                <div className={styles.intro}>
                    <header>
                        <h2>Take Part in Our Study</h2>
                    </header>
                    <div>
                        <p>
                            We are looking for people with hand dysfunction, ideally stroke survivors,
                            to help validate our design by playing our games.
                        </p>
                    </div>
                    <div className={styles.cta}>
                        <LinkButton to={`mailto:${CONTACT_EMAIL}`} size="large" icon={<Mail />}>Contact Us</LinkButton>
                        <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                    </div>
                </div>
                <div className={styles.session}>
                    <div className={styles.total}>
                        <span className={styles.minutes}>60</span>
                        <span>Minute Session</span>
                    </div>
                    <ol className={styles.path} aria-label="Session Plan">
                        {SESSION.map((part, index) => (
                            <li key={index} className={styles[part.kind]} style={{ flexGrow: part.minutes }}>
                                <motion.span
                                    className={styles.segment}
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.15 + index * 0.12, ease: EASE }}
                                />
                                <motion.span
                                    className={styles.node}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.1 + index * 0.12, ease: EASE }}
                                />
                                <span className={styles.label}>
                                    {part.label}
                                    <small>{`${part.minutes} min`}</small>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
                <ul className={styles.facts}>
                    <li>18 years or older</li>
                    <li>Stroke survivors preferred</li>
                    <li>
                        {"Sessions held at the "}
                        <UCalgary className={styles.ucalgary} />
                    </li>
                </ul>
            </Reveal>
        </section>
    );
}
