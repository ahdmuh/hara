import type { CSSProperties } from "react";
import type { GameID } from "../Games";
import styles from "./GameArt.module.css";

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

const ART = { range: RangeArt, strength: StrengthArt, speed: SpeedArt };

export default function GameArt({ game, still = false }: { game: GameID; still?: boolean })
{
    const Art = ART[game];
    return (
        <div className={`${styles.screen} ${still ? styles.still : ""}`}>
            <Art />
        </div>
    );
}
