import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { GAMES, type IGame } from "../Games";
import { useIntent } from "../Intents";
import { sounds } from "../Sounds";
import { firstName } from "../Names";
import Cartridge from "../ui/Cartridge";
import { formatDate, formatTime, useNow } from "../ui/Clock";
import Hints from "../ui/Hints";
import Rolling from "../ui/Rolling";
import { SettingsCog, Trophy } from "../ui/Icons";
import { DOCK as DOCK_MOTION, EASE, SPRING } from "../ui/Motion";
import Status from "../ui/Status";
import Wordmark from "../ui/Wordmark";
import styles from "./Home.module.css";

type Zone = "games" | "dock";

const DOCK = [
    { id: "settings", label: "Settings", icon: SettingsCog },
    { id: "progress", label: "Progress", icon: Trophy },
] as const;

export type DockID = typeof DOCK[number]["id"];

interface IHomeProps
{
    name: string;
    connected: boolean;
    initial: number;
    onPlay: (game: IGame, index: number) => void;
    onOpen: (id: DockID) => void;
}

const STEP_REM = 19.5;
const INSERT_MILLISECONDS = 950;

export default function Home({ name, connected, initial, onPlay, onOpen }: IHomeProps)
{
    const [zone, setZone] = useState<Zone>("games");
    const [game, setGame] = useState(initial);
    const [dock, setDock] = useState(0);
    const now = useNow();
    const selected = GAMES[game] ?? GAMES[0];
    const [inserting, setInserting] = useState(false);

    function insert(): void
    {
        if (inserting || !selected)
        {
            return;
        }
        setInserting(true);
        sounds.play("insert");
        window.setTimeout(() => onPlay(selected, game), INSERT_MILLISECONDS);
    }

    useIntent((intent) =>
    {
        if (inserting)
        {
            return false;
        }
        switch (intent)
        {
            case "previous":
            case "next":
            {
                const step = intent === "next" ? 1 : -1;
                if (zone === "games")
                {
                    const target = Math.min(GAMES.length - 1, Math.max(0, game + step));
                    setGame(target);
                    return target !== game;
                }
                const target = Math.min(DOCK.length - 1, Math.max(0, dock + step));
                setDock(target);
                return target !== dock;
            }
            case "down":
                setZone(zone === "games" ? "dock" : "games");
                return true;
            case "up":
                setZone("games");
                return zone !== "games";
            case "select":
                if (zone === "games")
                {
                    insert();
                    return false;
                }
                onOpen(DOCK[dock]?.id ?? "settings");
                return true;
            case "back":
                setZone("games");
                return zone !== "games";
        }
    });

    return (
        <div className={styles.home}>
            <header className={styles.top}>
                <Wordmark className={styles.brand} />
                <div className={styles.meta}>
                    <span className={styles.greeting}>{`Hi, ${firstName(name)}`}</span>
                    <Status connected={connected} />
                </div>
            </header>
            <section className={styles.stage} aria-label="Games">
                <div className={styles.tagSlot}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        {selected && !inserting && (
                            <motion.div
                                key={selected.id}
                                className={`${styles.tag} ${zone === "games" ? "" : styles.quiet}`}
                                initial={{ opacity: 0, y: "70%", scale: 0.6 }}
                                animate={{ opacity: 1, y: "0%", scale: 1, transition: { duration: 0.55, delay: 0.25, ease: EASE } }}
                                exit={{ opacity: 0, y: "50%", scale: 0.7, transition: { duration: 0.2, ease: EASE } }}
                            >
                                <strong>{selected.title}</strong>
                                <span>{selected.body}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <motion.div
                    className={styles.row}
                    animate={{ x: `${(1 - game) * STEP_REM}rem` }}
                    transition={SPRING}
                >
                    {GAMES.map((entry, index) => (
                        <Cartridge
                            key={entry.id}
                            game={entry}
                            selected={index === game}
                            inserting={inserting && index === game}
                            onChoose={() =>
                            {
                                setZone("games");
                                if (index === game)
                                {
                                    insert();
                                }
                                else
                                {
                                    setGame(index);
                                }
                            }}
                        />
                    ))}
                </motion.div>
                <ol className={styles.pips} aria-hidden="true">
                    {GAMES.map((entry, index) => <li key={entry.id} className={index === game ? styles.pip : ""} />)}
                </ol>
            </section>
            <motion.footer className={styles.dock} variants={DOCK_MOTION}>
                <svg className={styles.shape} viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
                    <path className={styles.fill} d="M0,40 L360,40 C430,40 450,6 520,6 L680,6 C750,6 770,40 840,40 L1200,40 L1200,140 L0,140 Z" />
                    <path className={styles.edge} d="M0,40 L360,40 C430,40 450,6 520,6 L680,6 C750,6 770,40 840,40 L1200,40" />
                </svg>
                {DOCK.map((entry, index) =>
                {
                    const Icon = entry.icon;
                    const active = zone === "dock" && dock === index;
                    return (
                        <motion.button
                            key={entry.id}
                            type="button"
                            className={`${styles.round} ${styles[entry.id]} ${active ? styles.active : ""}`}
                            animate={{ scale: active ? 1.08 : 1 }}
                            transition={SPRING}
                            onClick={() => onOpen(entry.id)}
                        >
                            <Icon />
                            <span>{entry.label}</span>
                        </motion.button>
                    );
                })}
                <div className={styles.clock}>
                    <Rolling text={formatTime(now)} className={styles.time} />
                    <span className={styles.date}>{formatDate(now)}</span>
                </div>
                <div className={styles.hints}>
                    <Hints
                        hints={[
                            { finger: "index", key: "←", label: "Previous" },
                            { finger: "ring", key: "→", label: "Next" },
                            { finger: "middle", key: "Enter", label: zone === "games" ? "Play" : "Open" },
                            { finger: "pinky", key: "↓", label: zone === "games" ? "Menu" : "Games" },
                        ]}
                    />
                </div>
            </motion.footer>
        </div>
    );
}
