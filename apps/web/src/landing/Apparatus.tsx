import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EASE } from "../ui/Motion";
import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Apparatus.module.css";
import Targets from "./Targets";

type Part = "rails" | "cuffs" | "base" | "sensors" | "stop";

const PARTS: { id: Part; title: string; body: string }[] = [
    {
        id: "rails",
        title: "One Rail per Finger",
        body: "Each finger moves along its own curved rail, and the rails rotate on their axis to fit different hand sizes.",
    },
    {
        id: "cuffs",
        title: "Magnetic Fingertip Cuffs",
        body: "Cuffs hold each fingertip and let go under abnormal stress or position, so nothing electronic sits on the hand.",
    },
    {
        id: "base",
        title: "Motors in the Base",
        body: "A motor and cable pair for each finger assists or resists it independently, from inside the tabletop base.",
    },
    {
        id: "sensors",
        title: "Position and Force Sensing",
        body: "An encoder at each motor and a load cell on each cable measure the position and force of every finger.",
    },
    {
        id: "stop",
        title: "Emergency Stop",
        body: "Force and travel never exceed your calibrated limits, and a hardware emergency stop frees the finger.",
    },
];

const RAILS = [
    { x: 206, y: 352, angle: -58, length: 150, travel: 58 },
    { x: 250, y: 300, angle: -17, length: 214, travel: 92 },
    { x: 296, y: 290, angle: -2, length: 236, travel: 104 },
    { x: 340, y: 296, angle: 12, length: 216, travel: 94 },
    { x: 380, y: 314, angle: 27, length: 176, travel: 74 },
];

const MOTORS = [150, 225, 300, 375, 450];
const CYCLE_MILLISECONDS = 3200;

export default function Apparatus()
{
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { margin: "-25% 0px -25% 0px" });
    const [active, setActive] = useState<Part | null>(null);
    const [pinned, setPinned] = useState(false);

    useEffect(() =>
    {
        if (!inView || pinned)
        {
            return;
        }
        const timer = window.setInterval(() =>
        {
            setActive((current) =>
            {
                const index = PARTS.findIndex(part => part.id === current);
                return PARTS[(index + 1) % PARTS.length]?.id ?? null;
            });
        }, CYCLE_MILLISECONDS);
        return () => window.clearInterval(timer);
    }, [inView, pinned]);

    const on = (part: Part) => (active === part ? styles.on : "");

    return (
        <div ref={ref} className={`${styles.apparatus} ${active ? styles.focused : ""}`}>
            <Reveal className={styles.head} group>
                <RevealItem as="header">
                    <h2>How HARA Works</h2>
                </RevealItem>
                <RevealItem>
                    <p>A tabletop device that measures, assists and resists each finger on its own.</p>
                </RevealItem>
            </Reveal>
            <div className={styles.body}>
                <motion.svg
                    className={styles.diagram}
                    viewBox="0 0 600 520"
                    role="img"
                    aria-label="Top-down diagram of the HARA device"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                    transition={{ duration: 0.9, ease: EASE }}
                >
                    <g className={`${styles.part} ${on("base")}`}>
                        <rect className={styles.housing} x="60" y="384" width="480" height="112" rx="30" />
                        {MOTORS.map(x => (
                            <g key={x}>
                                <circle className={styles.motor} cx={x} cy="440" r="20" />
                                <circle className={styles.spindle} cx={x} cy="440" r="6" />
                            </g>
                        ))}
                    </g>
                    <g className={`${styles.part} ${on("sensors")}`}>
                        {MOTORS.map(x => (
                            <g key={x}>
                                <circle className={styles.encoder} cx={x} cy="440" r="27" />
                                <rect className={styles.loadCell} x={x - 7} y="394" width="14" height="10" rx="2" />
                            </g>
                        ))}
                    </g>
                    {RAILS.map((rail, index) => (
                        <path
                            key={index}
                            className={styles.cable}
                            d={`M${rail.x},${rail.y} C${rail.x},${rail.y + 50} ${MOTORS[index] ?? 0},${380} ${MOTORS[index] ?? 0},${420}`}
                        />
                    ))}
                    <rect className={styles.palm} x="196" y="300" width="208" height="76" rx="38" />
                    {RAILS.map((rail, index) => (
                        <g key={index} transform={`translate(${rail.x} ${rail.y}) rotate(${rail.angle})`}>
                            <g className={`${styles.part} ${on("rails")}`}>
                                <rect className={styles.rail} x="-11" y={-rail.length} width="22" height={rail.length} rx="11" />
                                <line className={styles.groove} x1="0" y1={-rail.length + 14} x2="0" y2="-14" />
                            </g>
                            <g className={`${styles.part} ${on("cuffs")}`}>
                                <g
                                    className={styles.cuff}
                                    style={{ "--from": `${-rail.length + 34}px`, "--to": `${-rail.length + 34 + rail.travel}px`, "--i": index } as CSSProperties}
                                >
                                    <rect x="-16" y="-15" width="32" height="30" rx="10" />
                                    <circle cx="0" cy="0" r="4" />
                                </g>
                            </g>
                        </g>
                    ))}
                    <g className={`${styles.part} ${on("stop")}`}>
                        <circle className={styles.stopRing} cx="508" cy="358" r="22" />
                        <circle className={styles.stop} cx="508" cy="358" r="14" />
                    </g>
                </motion.svg>
                <Reveal as="ol" className={styles.list} group>
                    {PARTS.map((part, index) => (
                        <RevealItem as="li" key={part.id}>
                            <button
                                type="button"
                                className={`${styles.item} ${active === part.id ? styles.current : ""}`}
                                onMouseEnter={() =>
                                {
                                    setPinned(true);
                                    setActive(part.id);
                                }}
                                onMouseLeave={() => setPinned(false)}
                                onFocus={() =>
                                {
                                    setPinned(true);
                                    setActive(part.id);
                                }}
                                onBlur={() => setPinned(false)}
                            >
                                <span className={styles.number}>{`0${index + 1}`}</span>
                                <span className={styles.text}>
                                    <strong>{part.title}</strong>
                                    <span>{part.body}</span>
                                </span>
                            </button>
                        </RevealItem>
                    ))}
                </Reveal>
            </div>
            <Targets />
        </div>
    );
}
