import { FINGERS } from "@hara/input";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import HandFigure, { tipOf, type HandPose } from "./HandFigure";
import styles from "./HandDemo.module.css";

export type HandAction = "open" | "relax" | "fist" | "push" | "tap";

const FRAME_MILLISECONDS = 650;

function pose(curl: number | number[], spread = 0): HandPose
{
    return Object.fromEntries(FINGERS.map((finger, index) => [finger, { curl: Array.isArray(curl) ? curl[index] ?? 0 : curl, spread }])) as HandPose;
}

const FRAMES: Record<HandAction, { pose: HandPose; force: number }[]> = {
    open: [{ pose: pose(0.3, 0), force: 0 }, { pose: pose(0.12, 0.5), force: 0 }, { pose: pose(0, 1), force: 0 }],
    relax: [{ pose: pose(0.28, 0.1), force: 0 }, { pose: pose(0.36, 0.05), force: 0 }, { pose: pose(0.32, 0.1), force: 0 }],
    fist: [{ pose: pose(0.25), force: 0 }, { pose: pose(0.6), force: 0 }, { pose: pose(1), force: 0 }],
    push: [{ pose: pose(0.1, 0.2), force: 0 }, { pose: pose(0.1, 0.2), force: 0.5 }, { pose: pose(0.1, 0.2), force: 1 }],
    tap: [
        { pose: pose([0.1, 0.55, 0.05, 0.55, 0.05], 0.2), force: 0 },
        { pose: pose([0.1, 0.05, 0.55, 0.05, 0.55], 0.2), force: 0 },
        { pose: pose(0.05, 0.2), force: 0 },
    ],
};

export default function HandDemo({ action }: { action: HandAction })
{
    const [frame, setFrame] = useState(0);
    const current = FRAMES[action][frame % 3] ?? { pose: pose(0.3), force: 0 };

    useEffect(() =>
    {
        const timer = window.setInterval(() => setFrame(index => (index + 1) % 3), FRAME_MILLISECONDS);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className={styles.demo} role="img" aria-label="How to move your hand for this step">
            <svg className={styles.pressure} viewBox="-8 -18 156 190" aria-hidden="true">
                {FINGERS.map((finger) =>
                {
                    const [x, y] = tipOf(finger, current.pose[finger]);
                    return (
                        <motion.circle
                            key={finger}
                            cx={x}
                            cy={y}
                            initial={false}
                            animate={{ r: 5 + current.force * 7, opacity: current.force * 0.45 }}
                            transition={{ duration: 0.4 }}
                        />
                    );
                })}
            </svg>
            <HandFigure pose={current.pose} className={styles.figure} />
        </div>
    );
}
