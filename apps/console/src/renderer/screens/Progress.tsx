import { MILESTONE_TITLES, MilestoneBadge, type MilestoneKind } from "@hara/badges";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GAMES } from "../Games";
import { useIntent } from "../Intents";
import Hints from "../ui/Hints";
import { ChevronRight } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./Progress.module.css";

interface IProgressProps
{
    calibratedAt: Date | null;
    achieved: MilestoneKind[];
    onBack: () => void;
}

const NEXT: Record<string, MilestoneKind> = { range: "range", strength: "strength", speed: "speed" };

const FLAG_AT = 0.86;

const SHOWN: MilestoneKind[] = ["linked", "first", "sessions10", "range", "strength", "speed"];

const HIDDEN = 8;

function formatDay(date: Date): string
{
    return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function Progress({ calibratedAt, achieved, onBack }: IProgressProps)
{
    const row = useRef<HTMLUListElement>(null);
    const [more, setMore] = useState(true);

    function measure(): void
    {
        const list = row.current;
        if (list)
        {
            setMore(list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
        }
    }

    useEffect(() =>
    {
        const list = row.current;
        if (!list)
        {
            return;
        }
        const observer = new ResizeObserver(() => measure());
        observer.observe(list);
        return () => observer.disconnect();
    }, []);

    function scroll(step: number): boolean
    {
        const list = row.current;
        if (!list)
        {
            return false;
        }
        const before = list.scrollLeft;
        const width = list.firstElementChild?.getBoundingClientRect().width ?? 120;
        list.scrollBy({ left: step * (width + 12) * 2, behavior: "smooth" });
        return step > 0 ? before + list.clientWidth < list.scrollWidth - 2 : before > 2;
    }

    useIntent((intent) =>
    {
        if (intent === "back")
        {
            onBack();
            return true;
        }
        if (intent === "previous" || intent === "next")
        {
            return scroll(intent === "next" ? 1 : -1);
        }
        return false;
    });

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
            </div>
            <div className={styles.stage}>
                <div className={screen.heading}>
                    <h1>Progress</h1>
                </div>
                <ol className={styles.timelines}>
                    {GAMES.map((game, index) => (
                        <motion.li
                            key={game.id}
                            className={styles.timeline}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 * index, ease: EASE }}
                        >
                            <div className={styles.label}>
                                <strong>{game.title}</strong>
                                <span className={styles.value}>--</span>
                            </div>
                            <div className={styles.track}>
                                <motion.span
                                    className={styles.line}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.9, delay: 0.15 + 0.08 * index, ease: EASE }}
                                />
                                <span className={styles.start}>
                                    <span className={styles.node} />
                                    <small>{calibratedAt ? `Calibrated ${formatDay(calibratedAt)}` : "Not Calibrated"}</small>
                                </span>
                                <motion.span
                                    className={styles.reached}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 0 }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                />
                                <motion.span
                                    className={styles.flag}
                                    initial={{ left: "100%", opacity: 0 }}
                                    animate={{ left: `${FLAG_AT * 100}%`, opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.35 + 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
                                    data-metric={game.id}
                                >
                                    <span className={styles.pole} />
                                    <span className={styles.pennant}>
                                        <MilestoneBadge kind={NEXT[game.id] ?? "first"} size={22} />
                                    </span>
                                    <small>{MILESTONE_TITLES[NEXT[game.id] ?? "first"]}</small>
                                </motion.span>
                            </div>
                        </motion.li>
                    ))}
                </ol>
                <section className={styles.milestones} aria-label="Milestones">
                    <h2>Milestones</h2>
                    <div className={`${styles.shelf} ${more ? styles.fading : ""}`}>
                        <ul ref={row} className={styles.badges} onScroll={measure}>
                            {SHOWN.map((kind, index) =>
                            {
                                const earned = achieved.includes(kind);
                                return (
                                    <motion.li
                                        key={kind}
                                        className={earned ? styles.earned : styles.locked}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.3 + 0.05 * index, ease: EASE }}
                                    >
                                        <span className={styles.badge}>
                                            <MilestoneBadge kind={kind} size={56} />
                                        </span>
                                        <span className={styles.title}>{MILESTONE_TITLES[kind]}</span>
                                    </motion.li>
                                );
                            })}
                            {Array.from({ length: HIDDEN }, (_, index) => (
                                <motion.li
                                    key={`hidden-${index}`}
                                    className={styles.mystery}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3 + 0.05 * (SHOWN.length + index), ease: EASE }}
                                >
                                    <span className={styles.badge}>
                                        <span className={styles.question}>?</span>
                                    </span>
                                    <span className={styles.title}>???</span>
                                </motion.li>
                            ))}
                        </ul>
                        <AnimatePresence>
                            {more && (
                                <motion.button
                                    type="button"
                                    className={styles.more}
                                    aria-label="More Milestones"
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.6 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    onClick={() => scroll(1)}
                                >
                                    <ChevronRight />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
            <div className={screen.foot}>
                <Hints hints={[{ finger: "index", key: "←", label: "Previous" }, { finger: "ring", key: "→", label: "More" }, { finger: "thumb", key: "Esc", label: "Home" }]} />
            </div>
        </div>
    );
}
