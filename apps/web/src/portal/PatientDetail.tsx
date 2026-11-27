import { AnimatePresence, motion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { Link } from "../Router";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { ArrowLeft, Sliders, Trophy } from "../ui/Icons";
import { EASE, RISE, SPRING, STAGGER } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import Tooltip from "../ui/Tooltip";
import { daysSince, fullDate, relative } from "./Format";
import LineChart from "./LineChart";
import { findPatient, FINGER_NAMES, GAME_INFO, GAMES, saveTargets, type Game, type IPatient } from "./MockData";
import styles from "./PatientDetail.module.css";

const FINGER_COLORS = ["#5a4bff", "#16161a", "#a89eff", "#85858f", "#2e2470"];
const HISTORY_STEP = 10;

function Targets({ patient, open, onClose }: { patient: IPatient; open: boolean; onClose: () => void })
{
    const toast = useToast();
    const [targets, setTargets] = useState(patient.targets);
    return (
        <Dialog open={open} title="Adjust Targets" onClose={onClose}>
            <p className={styles.dialogNote}>
                The share of each calibrated maximum that games aim for. Changes reach the patient&apos;s app on their next sync.
            </p>
            <div className={styles.sliders}>
                {GAMES.map(game => (
                    <label key={game.id} className={styles.slider}>
                        <span className={styles.sliderHead}>
                            {game.name}
                            <b>{`${targets[game.id]}%`}</b>
                        </span>
                        <input
                            type="range"
                            min={20}
                            max={100}
                            step={5}
                            value={targets[game.id]}
                            style={{ "--fill": `${((targets[game.id] - 20) / 80) * 100}%` } as CSSProperties}
                            onChange={event => setTargets(current => ({ ...current, [game.id]: Number(event.target.value) }))}
                        />
                    </label>
                ))}
            </div>
            <div className={styles.dialogActions}>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() =>
                    {
                        saveTargets(patient.id, targets);
                        toast.success("Targets Saved", "They reach the patient's app on next sync.");
                        onClose();
                    }}
                >
                    Save Targets
                </Button>
            </div>
        </Dialog>
    );
}

export default function PatientDetail({ id }: { id: string })
{
    const patient = findPatient(id);
    const [game, setGame] = useState<Game>("range");
    const [hidden, setHidden] = useState<number[]>([]);
    const [shown, setShown] = useState(HISTORY_STEP);
    const [targetsOpen, setTargetsOpen] = useState(false);

    function toggleFinger(index: number): void
    {
        setHidden(current => (current.includes(index) ? current.filter(entry => entry !== index) : [...current, index]));
    }

    if (!patient)
    {
        return (
            <div className={styles.missing}>
                <h1>Patient Not Found</h1>
                <Link to="/patients" className={styles.back}>
                    <ArrowLeft />
                    All Patients
                </Link>
            </div>
        );
    }

    const meta = GAME_INFO[game];
    const sessions = patient.sessions.filter(session => session.game === game).slice(0, 30).reverse();
    const series = FINGER_NAMES.map((name, index) => ({
        name,
        color: FINGER_COLORS[index] ?? "#000",
        values: sessions.map(session => session.fingers[index] ?? 0),
    })).filter((_, index) => !hidden.includes(index));
    const minutes = patient.sessions.reduce((sum, session) => sum + session.minutes, 0);
    const lastSession = patient.sessions[0]?.date;
    const stats = [
        { label: "Sessions", value: patient.sessions.length.toString() },
        { label: "Minutes Played", value: minutes.toLocaleString("en-CA") },
        { label: "Last Session", value: relative(lastSession), alert: daysSince(lastSession) >= 7, text: true },
        { label: "Milestones", value: patient.milestones.length.toString() },
    ];

    return (
        <motion.div className={styles.detail} variants={STAGGER} initial="hidden" animate="shown">
            <motion.div variants={RISE}>
                <Link to="/patients" className={styles.back}>
                    <ArrowLeft />
                    All Patients
                </Link>
            </motion.div>
            <motion.header className={styles.head} variants={RISE}>
                <Avatar name={patient.name} size={72} />
                <div className={styles.title}>
                    <h1>{patient.name}</h1>
                    <p>{`Age ${patient.age} · ID ${patient.id} · Linked ${fullDate(patient.linkedAt)}`}</p>
                </div>
                <Button variant="dark" icon={<Sliders />} onClick={() => setTargetsOpen(true)}>Adjust Targets</Button>
            </motion.header>
            <motion.ul className={styles.stats} variants={RISE}>
                {stats.map(stat => (
                    <li key={stat.label} className={stat.alert ? styles.alert : ""}>
                        <span className={`${styles.statValue} ${stat.text ? styles.statText : ""}`}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                    </li>
                ))}
            </motion.ul>
            <motion.section className={styles.panel} variants={RISE}>
                <div className={styles.panelHead}>
                    <div className={styles.tabs} role="tablist" aria-label="Game">
                        {GAMES.map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                role="tab"
                                aria-selected={game === entry.id}
                                className={`${styles.tab} ${game === entry.id ? styles.activeTab : ""}`}
                                onClick={() => setGame(entry.id)}
                            >
                                {game === entry.id && <motion.span layoutId="gameTab" className={styles.tabPill} transition={SPRING} />}
                                <span>{entry.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className={styles.legend} aria-label="Fingers">
                        {FINGER_NAMES.map((name, index) => (
                            <button
                                key={name}
                                type="button"
                                aria-pressed={!hidden.includes(index)}
                                className={`${styles.chip} ${hidden.includes(index) ? styles.off : ""}`}
                                onClick={() => toggleFinger(index)}
                            >
                                <i style={{ background: FINGER_COLORS[index] }} />
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={game}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } }}
                        exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                    >
                        <LineChart
                            dates={sessions.map(session => session.date)}
                            series={series}
                            maximum={meta.maximum}
                            unit={meta.unit}
                            digits={meta.digits}
                            target={(patient.targets[game] / 100) * meta.maximum}
                        />
                    </motion.div>
                </AnimatePresence>
            </motion.section>
            <div className={styles.columns}>
                <motion.section className={styles.panel} variants={RISE}>
                    <h2>Session History</h2>
                    <table className={styles.history}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Game</th>
                                <th className={styles.numeric}>Minutes</th>
                                <th className={styles.numeric}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence initial={false}>
                                {patient.sessions.slice(0, shown).map(session => (
                                    <motion.tr
                                        key={session.id}
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3, ease: EASE }}
                                    >
                                        <td>{fullDate(session.date)}</td>
                                        <td>{GAME_INFO[session.game].name}</td>
                                        <td className={styles.numeric}>{session.minutes}</td>
                                        <td className={styles.numeric}>{session.score.toLocaleString("en-CA")}</td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {patient.sessions.length > HISTORY_STEP && (
                        <Button
                            variant="ghost"
                            size="small"
                            className={styles.more}
                            onClick={() => setShown(current => (current >= patient.sessions.length ? HISTORY_STEP : current + HISTORY_STEP * 2))}
                        >
                            {shown >= patient.sessions.length ? "Show Less" : "Show More"}
                        </Button>
                    )}
                </motion.section>
                <div className={styles.stack}>
                    <motion.section className={styles.panel} variants={RISE}>
                        <h2>Milestones</h2>
                        <ol className={styles.milestones}>
                            {patient.milestones.map(milestone => (
                                <li key={`${milestone.title}-${milestone.date}`}>
                                    <span className={styles.trophy} aria-hidden="true"><Trophy /></span>
                                    <span>
                                        <strong>{milestone.title}</strong>
                                        <small>{fullDate(milestone.date)}</small>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </motion.section>
                    <motion.section className={styles.panel} variants={RISE}>
                        <h2>Calibration History</h2>
                        <ol className={styles.calibrations}>
                            {patient.calibrations.map(calibration => (
                                <li key={calibration.date}>
                                    <span className={styles.calibrationDate}>{fullDate(calibration.date)}</span>
                                    <span className={styles.bars} aria-label="Range per Finger">
                                        {calibration.range.map((value, index) => (
                                            <Tooltip key={index} label={`${FINGER_NAMES[index]} ${value}%`} className={styles.barTip}>
                                                <span className={styles.track}>
                                                    <motion.i
                                                        initial={{ scaleY: 0 }}
                                                        animate={{ scaleY: value / 100 }}
                                                        transition={{ duration: 0.6, delay: 0.3 + index * 0.04, ease: EASE }}
                                                    />
                                                </span>
                                            </Tooltip>
                                        ))}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </motion.section>
                </div>
            </div>
            <Targets patient={patient} open={targetsOpen} onClose={() => setTargetsOpen(false)} />
        </motion.div>
    );
}
