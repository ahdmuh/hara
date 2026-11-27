import type { CSSProperties } from "react";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Games.module.css";

function RangeArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 120 80" aria-hidden="true">
            <path className={styles.arc} d="M14,70 A46,46 0 0 1 106,70" />
            <path className={styles.sweep} d="M14,70 A46,46 0 0 1 106,70" pathLength="100" />
            {Array.from({ length: 9 }, (_, index) =>
            {
                const angle = Math.PI - (index / 8) * Math.PI;
                return <circle key={index} className={styles.tick} cx={60 + Math.cos(angle) * 56} cy={70 - Math.sin(angle) * 56} r="1.6" />;
            })}
        </svg>
    );
}

function StrengthArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 120 80" aria-hidden="true">
            <rect className={styles.band} x="70" y="22" width="22" height="36" rx="4" />
            <rect className={styles.bar} x="10" y="34" width="100" height="12" rx="6" />
            <rect className={styles.fill} x="10" y="34" width="100" height="12" rx="6" />
        </svg>
    );
}

function SpeedArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 120 80" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
                <circle key={index} className={styles.beat} style={{ "--i": index } as CSSProperties} cx={20 + index * 20} cy="40" r="7" />
            ))}
        </svg>
    );
}

const METRICS = [
    {
        id: "range",
        title: "Range of Motion",
        body: "How far each finger opens and closes. Movement targets span your calibrated range and stretch further as your range grows.",
        art: RangeArt,
    },
    {
        id: "strength",
        title: "Strength",
        body: "How much force each finger can hold. Resistance is set as a share of your calibrated capacity, so effort stays challenging but safe.",
        art: StrengthArt,
    },
    {
        id: "speed",
        title: "Speed",
        body: "How quickly each finger moves and reacts. Timing gets tighter as your fingers get faster.",
        art: SpeedArt,
    },
];

export default function Games()
{
    return (
        <section className={styles.games} id="games">
            <Reveal className={styles.head} group>
                <RevealItem as="header">
                    <h2>Built Around the Movement It Trains</h2>
                </RevealItem>
                <RevealItem>
                    <p>Three games, each focused on one measure of hand function and tuned to your calibration.</p>
                </RevealItem>
            </Reveal>
            <Reveal as="ul" className={styles.list} group>
                {METRICS.map(metric => (
                    <RevealItem as="li" key={metric.id} className={styles.slot}>
                        <div className={styles.card}>
                            <div className={styles.screen}>
                                <metric.art />
                            </div>
                            <div className={styles.text}>
                                <h3>{metric.title}</h3>
                                <p>{metric.body}</p>
                            </div>
                        </div>
                    </RevealItem>
                ))}
            </Reveal>
        </section>
    );
}
