import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { navigate } from "../Router";
import { ChevronLeft, ChevronRight, ChevronDown, Close, Search } from "../ui/Icons";
import { EASE, SPRING } from "../ui/Motion";
import Avatar from "../ui/Avatar";
import { daysSince, relative } from "./Format";
import { GAMES, patients, trend, type Game, type IPatient } from "./MockData";
import styles from "./PatientList.module.css";
import Sparkline from "./Sparkline";

const PAGE_SIZE = 20;
const ROW = { hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } } };

type SortKey = "name" | "lastSession" | "sessions" | Game;
type Filter = "all" | "active" | "inactive";

const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active This Week" },
    { id: "inactive", label: "Inactive 7+ Days" },
];

const COLLATOR = new Intl.Collator("en-CA", { sensitivity: "base" });

interface IRow
{
    patient: IPatient;
    search: string;
    lastSession: number | undefined;
    trends: Record<Game, number[]>;
    current: Record<Game, number>;
}

function toRow(patient: IPatient): IRow
{
    const trends = { range: trend(patient, "range"), strength: trend(patient, "strength"), speed: trend(patient, "speed") };
    return {
        patient,
        search: `${patient.name} ${patient.id}`.toLowerCase(),
        lastSession: patient.sessions[0]?.date,
        trends,
        current: { range: trends.range.at(-1) ?? 0, strength: trends.strength.at(-1) ?? 0, speed: trends.speed.at(-1) ?? 0 },
    };
}

function compare(first: IRow, second: IRow, key: SortKey): number
{
    switch (key)
    {
        case "name":
            return COLLATOR.compare(first.patient.name, second.patient.name);
        case "lastSession":
            return (first.lastSession ?? 0) - (second.lastSession ?? 0);
        case "sessions":
            return first.patient.sessions.length - second.patient.sessions.length;
        default:
            return first.current[key] - second.current[key];
    }
}

export default function PatientList()
{
    const rows = useMemo(() => patients().map(toRow), []);
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);
    const [filter, setFilter] = useState<Filter>("all");
    const [sort, setSort] = useState<{ key: SortKey; descending: boolean }>({ key: "lastSession", descending: true });
    const [page, setPage] = useState(0);

    const visible = useMemo(() =>
    {
        const needle = deferredQuery.trim().toLowerCase();
        return rows
            .filter(row => !needle || row.search.includes(needle))
            .filter((row) =>
            {
                const idle = daysSince(row.lastSession);
                return filter === "all" || (filter === "active" ? idle < 7 : idle >= 7);
            })
            .sort((first, second) => compare(first, second, sort.key) * (sort.descending ? -1 : 1));
    }, [rows, deferredQuery, filter, sort]);

    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const current = Math.min(page, pages - 1);
    const slice = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

    function sortBy(key: SortKey): void
    {
        setSort(previous => ({ key, descending: previous.key === key ? !previous.descending : key !== "name" }));
        setPage(0);
    }

    function pager(position: "top" | "bottom")
    {
        return (
            <div className={`${styles.pager} ${styles[position]}`}>
                <span>{visible.length ? `${current * PAGE_SIZE + 1}–${Math.min(visible.length, (current + 1) * PAGE_SIZE)} of ${visible.length}` : "0 of 0"}</span>
                <div className={styles.pages}>
                    <button type="button" aria-label="Previous Page" disabled={current === 0} onClick={() => setPage(current - 1)}>
                        <ChevronLeft />
                    </button>
                    <span>{`${current + 1} / ${pages}`}</span>
                    <button type="button" aria-label="Next Page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                        <ChevronRight />
                    </button>
                </div>
            </div>
        );
    }

    function header(key: SortKey, label: string, className = "")
    {
        const active = sort.key === key;
        return (
            <th className={className} aria-sort={active ? (sort.descending ? "descending" : "ascending") : "none"}>
                <button type="button" className={`${styles.sort} ${active ? styles.sorted : ""}`} onClick={() => sortBy(key)}>
                    {label}
                    <motion.span
                        className={styles.caret}
                        animate={{ rotate: active && !sort.descending ? 180 : 0, opacity: active ? 1 : 0 }}
                        transition={SPRING}
                    >
                        <ChevronDown />
                    </motion.span>
                </button>
            </th>
        );
    }

    return (
        <div className={styles.list}>
            <div className={styles.head}>
                <h1>
                    Patients
                    <span className={styles.count}>{rows.length}</span>
                </h1>
                <label className={styles.search}>
                    <Search />
                    <input
                        type="search"
                        placeholder="Search by name or ID"
                        value={query}
                        onChange={(event) =>
                        {
                            setQuery(event.target.value);
                            setPage(0);
                        }}
                        aria-label="Search Patients"
                    />
                    <AnimatePresence>
                        {query && (
                            <motion.button
                                type="button"
                                className={styles.clear}
                                aria-label="Clear Search"
                                onClick={() => setQuery("")}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                            >
                                <Close />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </label>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.filters} role="tablist" aria-label="Filter Patients">
                    {FILTERS.map(entry => (
                        <button
                            key={entry.id}
                            type="button"
                            role="tab"
                            aria-selected={filter === entry.id}
                            className={`${styles.filter} ${filter === entry.id ? styles.selected : ""}`}
                            onClick={() =>
                            {
                                setFilter(entry.id);
                                setPage(0);
                            }}
                        >
                            {filter === entry.id && <motion.span layoutId="patientFilter" className={styles.pill} transition={SPRING} />}
                            <span>{entry.label}</span>
                        </button>
                    ))}
                </div>
                {pager("top")}
            </div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <colgroup>
                        <col className={styles.colPatient} />
                        <col className={styles.colLast} />
                        <col className={styles.colSessions} />
                        <col className={styles.colMetric} />
                        <col className={styles.colMetric} />
                        <col className={styles.colMetric} />
                        <col className={styles.colMilestone} />
                    </colgroup>
                    <thead>
                        <tr>
                            {header("name", "Patient")}
                            {header("lastSession", "Last Session")}
                            {header("sessions", "Sessions", styles.numeric)}
                            {GAMES.map(game => header(game.id, game.name))}
                            <th>Latest Milestone</th>
                        </tr>
                    </thead>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.tbody
                            key={`${current}-${filter}-${sort.key}-${sort.descending}`}
                            initial="hidden"
                            animate="shown"
                            exit="gone"
                            variants={{ shown: { transition: { staggerChildren: 0.018 } }, gone: { opacity: 0, transition: { duration: 0.12 } } }}
                        >
                            {slice.map(row => (
                                <motion.tr
                                    key={row.patient.id}
                                    className={styles.row}
                                    variants={ROW}
                                    onClick={() => navigate(`/patients/${row.patient.id}`)}
                                    onKeyDown={(event) =>
                                    {
                                        if (event.key === "Enter")
                                        {
                                            navigate(`/patients/${row.patient.id}`);
                                        }
                                    }}
                                    tabIndex={0}
                                    aria-label={`Open ${row.patient.name}`}
                                >
                                    <td>
                                        <span className={styles.patient}>
                                            <Avatar name={row.patient.name} size={38} />
                                            <span className={styles.identity}>
                                                <strong>{row.patient.name}</strong>
                                                <span>{`${row.patient.age} · ${row.patient.id}`}</span>
                                            </span>
                                        </span>
                                    </td>
                                    <td data-label="Last Session">
                                        <span className={daysSince(row.lastSession) >= 7 ? styles.idle : ""}>{relative(row.lastSession)}</span>
                                    </td>
                                    <td data-label="Sessions" className={styles.numeric}>{row.patient.sessions.length}</td>
                                    {GAMES.map(game => (
                                        <td key={game.id} data-label={game.name}>
                                            <span className={styles.metric}>
                                                <Sparkline values={row.trends[game.id]} width={72} height={24} />
                                                <span className={styles.value}>
                                                    {row.current[game.id].toFixed(game.digits)}
                                                    <small>{game.unit}</small>
                                                </span>
                                            </span>
                                        </td>
                                    ))}
                                    <td data-label="Latest Milestone" className={styles.milestone}>{row.patient.milestones[0]?.title ?? "None"}</td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </AnimatePresence>
                </table>
                {slice.length === 0 && (
                    <motion.p className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        No patients match your search.
                    </motion.p>
                )}
            </div>
            {pager("bottom")}
        </div>
    );
}
