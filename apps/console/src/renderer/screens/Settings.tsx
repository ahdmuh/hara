import { motion } from "motion/react";
import { useState } from "react";
import { useIntent } from "../Intents";
import { music, saveVolume, storedVolume, VOLUME_STEPS } from "../Music";
import { sounds } from "../Sounds";
import Hints from "../ui/Hints";
import { Logout, Reload, Usb, UserPlus, Volume2 } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./Settings.module.css";
import Ring from "../ui/Ring";

const ROWS = [
    { id: "recalibrate", label: "Recalibrate", icon: Reload },
    { id: "clinician", label: "Clinician", icon: UserPlus },
    { id: "device", label: "Device", icon: Usb },
    { id: "volume", label: "Volume", icon: Volume2 },
    { id: "signOut", label: "Sign Out", icon: Logout },
] as const;

type RowID = typeof ROWS[number]["id"];

interface ISettingsProps
{
    connected: boolean;
    firmware: string | null;
    linked: boolean;
    onLink: () => void;
    onRecalibrate: () => void;
    onSignOut: () => void;
    onBack: () => void;
}

export default function Settings({ connected, firmware, linked, onLink, onRecalibrate, onSignOut, onBack }: ISettingsProps)
{
    const [row, setRow] = useState(0);
    const [volume, setVolume] = useState(storedVolume);
    const current = ROWS[row]?.id ?? "recalibrate";

    function changeVolume(step: number): void
    {
        const next = Math.min(VOLUME_STEPS, Math.max(0, volume + step));
        setVolume(next);
        saveVolume(next);
        music.setVolume(next / VOLUME_STEPS);
        sounds.setVolume(next / VOLUME_STEPS);
    }

    function choose(id: RowID): boolean
    {
        if (id === "recalibrate")
        {
            onRecalibrate();
            return true;
        }
        if (id === "clinician" && !linked)
        {
            onLink();
            return true;
        }
        if (id === "signOut")
        {
            onSignOut();
            return true;
        }
        return false;
    }

    useIntent((intent) =>
    {
        switch (intent)
        {
            case "up":
                setRow(Math.max(0, row - 1));
                return row > 0;
            case "down":
                setRow((row + 1) % ROWS.length);
                return true;
            case "previous":
            case "next":
            {
                const step = intent === "next" ? 1 : -1;
                if (current === "volume")
                {
                    const level = Math.min(VOLUME_STEPS, Math.max(0, volume + step));
                    changeVolume(step);
                    return level !== volume;
                }
                const target = Math.min(ROWS.length - 1, Math.max(0, row + step));
                setRow(target);
                return target !== row;
            }
            case "select":
                return choose(current);
            case "back":
                onBack();
                return true;
        }
    });

    function value(id: RowID)
    {
        switch (id)
        {
            case "clinician":
                return <span className={linked ? styles.good : styles.muted}>{linked ? "Linked" : "Not Linked"}</span>;
            case "device":
                return <span className={connected ? styles.good : styles.muted}>{connected ? `Connected${firmware ? `, Firmware ${firmware}` : ""}` : "Not Connected"}</span>;
            case "volume":
                return (
                    <span className={styles.volume} aria-label={`Volume ${volume} of ${VOLUME_STEPS}`}>
                        {Array.from({ length: VOLUME_STEPS }, (_, index) => <span key={index} className={index < volume ? styles.level : ""} />)}
                    </span>
                );
            default:
                return null;
        }
    }

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
            </div>
            <div className={styles.stage}>
                <motion.div
                    className={screen.heading}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                >
                    <h1>Settings</h1>
                </motion.div>
                <ul className={styles.rows}>
                    {ROWS.map((entry, index) =>
                    {
                        const Icon = entry.icon;
                        return (
                            <motion.li
                                key={entry.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.05 * index, ease: EASE }}
                            >
                                <button
                                    type="button"
                                    className={`${styles.row} ${index === row ? styles.current : ""} ${entry.id === "signOut" ? styles.danger : ""}`}
                                    onClick={() =>
                                    {
                                        setRow(index);
                                        choose(entry.id);
                                    }}
                                >
                                    {index === row && <Ring id="settingsRing" radius={1.4} tone={entry.id === "signOut" ? "danger" : "accent"} />}
                                    <span className={styles.icon}><Icon /></span>
                                    <span className={styles.label}>{entry.label}</span>
                                    {value(entry.id)}
                                </button>
                            </motion.li>
                        );
                    })}
                </ul>
            </div>
            <div className={screen.foot}>
                <Hints
                    hints={[
                        { finger: "pinky", key: "↓", label: "Move" },
                        ...(current === "volume" ? [{ finger: "index" as const, key: "←", label: "Quieter" }, { finger: "ring" as const, key: "→", label: "Louder" }] : [{ finger: "middle" as const, key: "Enter", label: "Select" }]),
                        { finger: "thumb", key: "Esc", label: "Home" },
                    ]}
                />
            </div>
        </div>
    );
}
