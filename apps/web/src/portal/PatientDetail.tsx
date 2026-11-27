import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AnimatePresence, motion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Link } from "../Router";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { ArrowLeft, Sliders } from "../ui/Icons";
import { EASE, RISE, SPRING, STAGGER } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import Tooltip from "../ui/Tooltip";
import { daysSince, fullDate, relative } from "./Format";
import LineChart from "./LineChart";
import MilestoneBadge from "./MilestoneBadge";
import { FINGER_NAMES, GAME_INFO, GAMES, MILESTONE_TITLES, type Game } from "./Games";
import styles from "./PatientDetail.module.css";

const FINGER_COLORS = ["#2fa8e6", "#16161a", "#7cc8ee", "#85858f", "#00507a"];

type IPatient = NonNullable<FunctionReturnType<typeof api.Clinician.patient>>;
const HISTORY_STEP = 10;

function Targets({ patient, open, onClose }: { patient: IPatient; open: boolean; onClose: () => void })
{
    const toast = useToast();
    const save = useMutation(api.Clinician.setTargets);
    const [targets, setTargets] = useState(patient.targets);
    const [busy, setBusy] = useState(false);

    async function submit(): Promise<void>
    {
        setBusy(true);
        try
        {
            await save({ patientID: patient.id as Id<"patients">, targets });
            toast.success("Targets Saved", "They reach the patient's app on next sync.");
            onClose();
        }
        catch
        {
            toast.error("Could Not Save Targets", "Check your connection and try again.");
        }
        setBusy(false);
    }
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
                <Button busy={busy} onClick={() => void submit()}>Save Targets</Button>
            </div>
        </Dialog>
    );
}

export default function PatientDetail({ id }: { id: string })
{
    const patient = useQuery(api.Clinician.patient, { patientID: id });
    const [game, setGame] = useState<Game>("rangeOfMotion");
    const [hidden, setHidden] = useState<number[]>([]);
    const [shown, setShown] = useState(HISTORY_STEP);
    const [targetsOpen, setTargetsOpen] = useState(false);

    function toggleFinger(index: number): void
    {
        setHidden(current => (current.includes(index) ? current.filter(entry => entry !== index) : [...current, index]));
    }

    if (patient === undefined)
    {
        return <div className={styles.loading} aria-label="Loading Patient" />;
    }

    if (patient === null)
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
    const lastSession = patient.sessions[0]?.startedAt;
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
                    <p>{`${patient.age === null ? "Age Unknown" : `Age ${patient.age}`} · Linked ${fullDate(patient.linkedAt)}`}</p>
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
                <div className={styles.stage}>
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={game}
                            className={styles.layer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.35, ease: EASE } }}
                            exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE } }}
                        >
                            <LineChart
                                dates={sessions.map(session => session.startedAt)}
                                series={series}
                                maximum={meta.maximum}
                                unit={meta.unit}
                                digits={meta.digits}
                                target={(patient.targets[game] / 100) * meta.maximum}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
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
                                        <td>{fullDate(session.startedAt)}</td>
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
                                <li key={`${milestone.kind}-${milestone.achievedAt}`}>
                                    <MilestoneBadge kind={milestone.kind} size={36} />
                                    <span>
                                        <strong>{MILESTONE_TITLES[milestone.kind]}</strong>
                                        <small>{fullDate(milestone.achievedAt)}</small>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </motion.section>
                    <motion.section className={styles.panel} variants={RISE}>
                        <h2>Calibration History</h2>
                        <ol className={styles.calibrations}>
                            {patient.calibrations.map(calibration => (
                                <li key={calibration.takenAt}>
                                    <span className={styles.calibrationDate}>{fullDate(calibration.takenAt)}</span>
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
