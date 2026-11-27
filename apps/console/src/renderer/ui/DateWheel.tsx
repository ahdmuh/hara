import { AnimatePresence, motion } from "motion/react";
import type { ClipboardEvent, KeyboardEvent, PointerEvent, WheelEvent } from "react";
import { daysIn, FIRST_YEAR } from "../DateEntry";
import { ChevronDown, ChevronUp } from "./Icons";
import { EASE, SPRING } from "./Motion";
import styles from "./DateWheel.module.css";
import Ring from "./Ring";

export interface ISimpleDate
{
    year: number;
    month: number;
    day: number;
}

export type DateColumn = "month" | "day" | "year";

export const DATE_COLUMNS: DateColumn[] = ["year", "month", "day"];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function wrap(value: number, minimum: number, maximum: number): number
{
    const span = maximum - minimum + 1;
    return ((((value - minimum) % span) + span) % span) + minimum;
}

export function stepDate(date: ISimpleDate, column: DateColumn, step: number, today: ISimpleDate): ISimpleDate
{
    const next = { ...date };
    if (column === "month")
    {
        next.month = wrap(date.month + step, 1, 12);
    }
    else if (column === "year")
    {
        next.year = Math.min(today.year, Math.max(FIRST_YEAR, date.year + step));
    }
    else
    {
        next.day = wrap(date.day + step, 1, daysIn(date.year, date.month));
    }
    next.day = Math.min(next.day, daysIn(next.year, next.month));
    const latest = today.year * 10000 + today.month * 100 + today.day;
    return next.year * 10000 + next.month * 100 + next.day > latest ? date : next;
}

export function formatISO(date: ISimpleDate): string
{
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

interface IDateWheelProps
{
    date: ISimpleDate;
    column: DateColumn;
    direction: number;
    partial: (column: DateColumn) => string | null;
    onStep: (column: DateColumn, step: number) => void;
    onColumn: (column: DateColumn) => void;
    onType: (text: string) => void;
    onErase: () => void;
    onMove: (step: number) => void;
}

export default function DateWheel({ date, column, direction, partial, onStep, onColumn, onType, onErase, onMove }: IDateWheelProps)
{
    const labels: Record<DateColumn, string> = {
        month: partial("month") ?? MONTHS[date.month - 1] ?? "",
        day: partial("day") ?? String(date.day),
        year: partial("year") ?? String(date.year),
    };

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void
    {
        if (/^\d$/.test(event.key) || /^[-/. ]$/.test(event.key))
        {
            event.preventDefault();
            onType(event.key);
        }
        else if (event.key === "Backspace")
        {
            event.preventDefault();
            onErase();
        }
        else if (event.key === "ArrowLeft" || event.key === "ArrowRight")
        {
            event.preventDefault();
            onMove(event.key === "ArrowRight" ? 1 : -1);
        }
    }

    return (
        <div className={styles.wheel} role="group" aria-label="Birthday">
            <input
                className={styles.capture}
                data-capture
                autoFocus
                inputMode="numeric"
                aria-label="Type Your Birthday"
                value=""
                onChange={() => undefined}
                onKeyDown={onKeyDown}
                onPaste={(event: ClipboardEvent<HTMLInputElement>) =>
                {
                    event.preventDefault();
                    onType(event.clipboardData.getData("text"));
                }}
                onBlur={event => event.currentTarget.focus()}
            />
            {DATE_COLUMNS.map((entry, index) =>
            {
                const active = entry === column;
                return (
                    <motion.div
                        className={`${styles.column} ${styles[entry]} ${active ? styles.active : ""}`}
                        aria-label={entry}
                        data-column={entry}
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.08 * index, ease: EASE }}
                        key={entry}
                        onPointerDown={(event: PointerEvent) =>
                        {
                            event.preventDefault();
                            onColumn(entry);
                        }}
                        onWheel={(event: WheelEvent) =>
                        {
                            onColumn(entry);
                            onStep(entry, event.deltaY > 0 ? 1 : -1);
                        }}
                    >
                        {active && <Ring id="dateRing" radius={1.2} />}
                        <motion.button
                            type="button"
                            className={styles.arrow}
                            aria-label={`Previous ${entry}`}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.82 }}
                            transition={SPRING}
                            onClick={() => onStep(entry, -1)}
                        >
                            <ChevronUp />
                        </motion.button>
                        <span className={styles.window} data-window>
                            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                                <motion.span
                                    key={labels[entry]}
                                    className={styles.value}
                                    custom={direction}
                                    variants={{
                                        enter: (sign: number) => ({ y: `${sign * 70}%`, opacity: 0 }),
                                        center: { y: "0%", opacity: 1 },
                                        leave: (sign: number) => ({ y: `${sign * -70}%`, opacity: 0 }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="leave"
                                    transition={{ duration: 0.28, ease: EASE }}
                                >
                                    {labels[entry]}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                        <motion.button
                            type="button"
                            className={styles.arrow}
                            aria-label={`Next ${entry}`}
                            whileHover={{ y: 2 }}
                            whileTap={{ scale: 0.82 }}
                            transition={SPRING}
                            onClick={() => onStep(entry, 1)}
                        >
                            <ChevronDown />
                        </motion.button>
                    </motion.div>
                );
            })}
        </div>
    );
}
