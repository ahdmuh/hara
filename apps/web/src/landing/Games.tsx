import type { CSSProperties } from "react";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Games.module.css";

const RUNE = [[1, 5], [1, 4], [1, 3], [1, 2], [1, 1], [2, 2], [3, 3], [4, 2], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5]];
const NOTES = [[0, 0], [2, 0.5], [4, 1], [1, 1.5], [3, 2], [0, 2.5], [4, 3], [2, 3.5]];

function RuneArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 70 70" aria-hidden="true">
            {Array.from({ length: 49 }, (_, index) => (
                <rect key={index} className={styles.grid} x={(index % 7) * 10 + 3} y={Math.floor(index / 7) * 10 + 3} width="4" height="4" rx="0.6" />
            ))}
            {RUNE.map(([column, row], step) => (
                <rect
                    key={step}
                    className={styles.rune}
                    style={{ "--step": step } as CSSProperties}
                    x={(column ?? 0) * 10 + 2}
                    y={(row ?? 0) * 10 + 2}
                    width="6"
                    height="6"
                    rx="0.8"
                />
            ))}
        </svg>
    );
}

function StrengthArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 70 70" aria-hidden="true">
            <rect className={styles.band} x="4" y="11" width="62" height="20" rx="3" />
            {Array.from({ length: 6 }, (_, column) => (
                Array.from({ length: 6 }, (_, row) => (
                    <rect
                        key={`${column}-${row}`}
                        className={row < 4 ? styles.forceOn : row === 4 ? styles.forceMid : styles.forceTop}
                        style={{ "--column": column } as CSSProperties}
                        x={column * 10 + 8}
                        y={60 - row * 9}
                        width="4"
                        height="4"
                        rx="0.6"
                    />
                ))
            ))}
        </svg>
    );
}

function SpeedArt()
{
    return (
        <svg className={styles.art} viewBox="0 0 70 70" aria-hidden="true">
            {Array.from({ length: 5 }, (_, track) => (
                <rect key={track} className={styles.lane} x={track * 13 + 6} y="2" width="6" height="66" rx="3" />
            ))}
            <rect className={styles.hit} x="2" y="56" width="66" height="2" rx="1" />
            {NOTES.map(([track, delay], index) => (
                <rect
                    key={index}
                    className={styles.note}
                    style={{ "--delay": delay } as CSSProperties}
                    x={(track ?? 0) * 13 + 6}
                    y="0"
                    width="6"
                    height="6"
                    rx="1"
                />
            ))}
        </svg>
    );
}

const GAMES = [
    {
        id: "range",
        title: "Range of Motion",
        body: "A turn-based dungeon crawler. Trace runes with your fingers to attack, shield and heal, with no time pressure.",
        art: RuneArt,
    },
    {
        id: "strength",
        title: "Strength",
        body: "A fishing game where the fish pulls back. Clutch to charge your cast, then hold your force in a target band to reel in.",
        art: StrengthArt,
    },
    {
        id: "speed",
        title: "Speed",
        body: "A rhythm game with one track per finger. Tap as each symbol reaches the end, and clear 80% to unlock the next level.",
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
                    <p>Three games, each one training a different part of recovery, all tuned to your calibration.</p>
                </RevealItem>
            </Reveal>
            <Reveal as="ul" className={styles.list} group>
                {GAMES.map(game => (
                    <RevealItem as="li" key={game.id} className={styles.card}>
                        <div className={styles.screen}>
                            <game.art />
                        </div>
                        <div className={styles.text}>
                            <h3>{game.title}</h3>
                            <p>{game.body}</p>
                        </div>
                    </RevealItem>
                ))}
            </Reveal>
        </section>
    );
}
