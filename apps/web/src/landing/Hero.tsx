import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown } from "../ui/Icons";
import { useRef } from "react";
import handPoster from "../assets/shared/hara-hand.jpg";
import handVideo from "../assets/shared/hara-hand.mp4";
import { LinkButton } from "../ui/Button";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import styles from "./Hero.module.css";

export default function Hero()
{
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const handY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
    const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <section ref={ref} className={styles.hero} id="top">
            <motion.div
                className={styles.screen}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: EASE }}
            >
                <motion.div className={styles.hand} style={{ y: handY }}>
                    <motion.video
                        className={styles.video}
                        src={handVideo}
                        poster={handPoster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 2.2, delay: 0.3, ease: EASE }}
                    />
                </motion.div>
                <motion.div className={styles.title} style={{ y: wordY, opacity: fade }}>
                    <h1 className={styles.wordmark}>
                        <Wordmark animate delay={0.4} />
                    </h1>
                    <motion.p
                        className={styles.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
                    >
                        Hand Assistive Rehabilitation Apparatus
                    </motion.p>
                </motion.div>
                <motion.div
                    className={styles.foot}
                    style={{ opacity: fade }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 1.5, ease: EASE }}
                >
                    <p className={styles.lead}>
                        A tabletop device that turns hand rehabilitation into games, built for stroke survivors.
                    </p>
                    <div className={styles.cta}>
                        <LinkButton to="#take-part" size="large">Take Part</LinkButton>
                        <LinkButton to="#about" size="large" variant="light" iconAfter={<ArrowDown />}>Learn More</LinkButton>
                    </div>
                </motion.div>
                <span className={styles.slot} aria-hidden="true" />
            </motion.div>
        </section>
    );
}
