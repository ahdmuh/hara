import { motion } from "motion/react";
import styles from "./Backdrop.module.css";

const WAVE = "M0,40 C150,10 300,10 450,40 C600,70 750,70 900,40 C1050,10 1200,10 1350,40 C1500,70 1650,70 1800,40";

export default function Backdrop()
{
    return (
        <motion.div
            className={styles.backdrop}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
        >
            <div className={styles.stripes} />
            <div className={styles.waves}>
                {["far", "mid", "near"].map(layer => (
                    <svg key={layer} className={`${styles.wave} ${styles[layer]}`} viewBox="0 0 1800 80" preserveAspectRatio="none">
                        <path d={WAVE} />
                    </svg>
                ))}
            </div>
        </motion.div>
    );
}
