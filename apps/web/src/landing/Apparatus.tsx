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
                    <h2>How It Works</h2>
                </RevealItem>
                <RevealItem>
                    <p>A tabletop device that measures, assists and resists each finger on its own.</p>
                </RevealItem>
            </Reveal>
            <div className={styles.body}>
                <motion.div
                    className={styles.figure}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                    transition={{ duration: 0.9, ease: EASE }}
                >
                    <svg className={styles.shadows} viewBox="44 44 520 468" aria-hidden="true">
                        <defs>
                            <filter id="haraShadow" x="-20%" y="-20%" width="140%" height="160%">
                                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#16161a" floodOpacity="0.16" />
                            </filter>
                            <filter id="haraSoft" x="-40%" y="-40%" width="180%" height="180%">
                                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#16161a" floodOpacity="0.22" />
                            </filter>
                        </defs>
                        <rect className={styles.shade} x="60" y="384" width="480" height="112" rx="32" filter="url(#haraShadow)" />
                        <rect className={styles.shade} x="196" y="300" width="208" height="76" rx="38" filter="url(#haraShadow)" />
                        <circle className={styles.shade} cx="508" cy="356" r="24" filter="url(#haraSoft)" />
                        <g filter="url(#haraSoft)">
                            {RAILS.map((rail, index) => (
                                <rect
                                    key={index}
                                    className={styles.shade}
                                    transform={`translate(${rail.x} ${rail.y}) rotate(${rail.angle})`}
                                    x="-12"
                                    y={-rail.length}
                                    width="24"
                                    height={rail.length}
                                    rx="12"
                                />
                            ))}
                        </g>
                    </svg>
                    <svg
                        className={styles.diagram}
                        viewBox="44 44 520 468"
                        role="img"
                        aria-label="Top-down diagram of the HARA device"
                    >
                        <defs>
                            <linearGradient id="haraHousing" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#2b2b32" />
                                <stop offset="1" stopColor="#111115" />
                            </linearGradient>
                            <linearGradient id="haraRail" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" stopColor="#ffffff" />
                                <stop offset="1" stopColor="#ececea" />
                            </linearGradient>
                            <linearGradient id="haraCuff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#2c2c33" />
                                <stop offset="1" stopColor="#0d0d10" />
                            </linearGradient>
                            <linearGradient id="haraCuffOn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#4aa3ff" />
                                <stop offset="1" stopColor="#0a6fe0" />
                            </linearGradient>
                            <radialGradient id="haraStop" cx="0.4" cy="0.35" r="0.7">
                                <stop offset="0" stopColor="#ff8a8a" />
                                <stop offset="0.6" stopColor="#e5484d" />
                                <stop offset="1" stopColor="#b8262b" />
                            </radialGradient>
                            <radialGradient id="haraMotor" cx="0.4" cy="0.35" r="0.75">
                                <stop offset="0" stopColor="#4a4a53" />
                                <stop offset="1" stopColor="#1c1c21" />
                            </radialGradient>
                        </defs>
                        <g className={`${styles.part} ${on("base")}`}>
                            <rect className={styles.housing} x="60" y="384" width="480" height="112" rx="32" />
                            <rect className={styles.bevel} x="62" y="386" width="476" height="108" rx="30" />
                            {MOTORS.map(x => (
                                <g key={x}>
                                    <circle className={styles.knurl} cx={x} cy="440" r="22" />
                                    <circle className={styles.motor} cx={x} cy="440" r="18" />
                                    <circle className={styles.motorOn} cx={x} cy="440" r="18" />
                                    <circle className={styles.spindle} cx={x} cy="440" r="5.5" />
                                </g>
                            ))}
                        </g>
                        <g className={`${styles.part} ${on("sensors")}`}>
                            {MOTORS.map(x => (
                                <g key={x}>
                                    <circle className={styles.encoder} cx={x} cy="440" r="28" />
                                    <rect className={styles.loadCell} x={x - 8} y="396" width="16" height="8" rx="4" />
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
                        <g>
                            <rect className={styles.palm} x="196" y="300" width="208" height="76" rx="38" />
                            <rect className={styles.palmPad} x="214" y="314" width="172" height="48" rx="24" />
                        </g>
                        {RAILS.map((rail, index) => (
                            <g key={index} transform={`translate(${rail.x} ${rail.y}) rotate(${rail.angle})`}>
                                <g className={`${styles.part} ${on("rails")}`}>
                                    <rect className={styles.rail} x="-12" y={-rail.length} width="24" height={rail.length} rx="12" />
                                    <rect className={styles.groove} x="-2" y={-rail.length + 14} width="4" height={rail.length - 28} rx="2" />
                                </g>
                                <g className={`${styles.part} ${on("cuffs")}`}>
                                    <g
                                        className={styles.cuff}
                                        style={{ "--from": `${-rail.length + 34}px`, "--to": `${-rail.length + 34 + rail.travel}px`, "--i": index } as CSSProperties}
                                    >
                                        <rect className={styles.cuffShadow} x="-16" y="-11" width="32" height="30" rx="11" />
                                        <rect className={styles.cuffBody} x="-17" y="-15" width="34" height="30" rx="11" />
                                        <rect className={styles.cuffOn} x="-17" y="-15" width="34" height="30" rx="11" />
                                        <rect className={styles.cuffShine} x="-12" y="-12" width="24" height="4" rx="2" />
                                        <circle className={styles.halo} cx="0" cy="3" r="7" />
                                        <circle className={styles.led} cx="0" cy="3" r="3.5" />
                                    </g>
                                </g>
                            </g>
                        ))}
                        <g className={`${styles.part} ${on("stop")}`}>
                            <circle className={styles.stopRing} cx="508" cy="356" r="24" />
                            <circle className={styles.stop} cx="508" cy="356" r="16" />
                            <ellipse className={styles.stopShine} cx="503" cy="350" rx="6" ry="3.5" />
                        </g>
                    </svg>
                </motion.div>
                <Reveal as="ol" className={styles.list} group>
                    {PARTS.map((part, index) => (
                        <RevealItem as="li" key={part.id}>
                            <button
                                type="button"
                                className={`${styles.item} ${active === part.id ? styles.current : ""}`}
                                onPointerEnter={(event) =>
                                {
                                    if (event.pointerType === "mouse")
                                    {
                                        setPinned(true);
                                        setActive(part.id);
                                    }
                                }}
                                onPointerLeave={() => setPinned(false)}
                                onClick={() => setActive(part.id)}
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
