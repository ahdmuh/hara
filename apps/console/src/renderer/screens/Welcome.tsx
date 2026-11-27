import { motion } from "motion/react";
import { useState } from "react";
import { useIntent } from "../Intents";
import Hints from "../ui/Hints";
import { Login, UserPlus } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import Ring from "../ui/Ring";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./Welcome.module.css";

const CHOICES = [
    { id: "create", label: "Create an Account", icon: UserPlus },
    { id: "signIn", label: "I Have an Account", icon: Login },
] as const;

export type Choice = typeof CHOICES[number]["id"];

export default function Welcome({ onChoose, onBack }: { onChoose: (choice: Choice) => void; onBack: () => void })
{
    const [index, setIndex] = useState(0);

    useIntent((intent) =>
    {
        if (intent === "previous" || intent === "next")
        {
            const target = intent === "next" ? 1 : 0;
            setIndex(target);
            return target !== index;
        }
        if (intent === "select")
        {
            onChoose(CHOICES[index]?.id ?? "create");
            return true;
        }
        if (intent === "back")
        {
            onBack();
            return true;
        }
        return false;
    });

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
            </div>
            <div className={styles.stage}>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                    Welcome
                </motion.h1>
                <ul className={styles.choices}>
                    {CHOICES.map((choice, position) =>
                    {
                        const Icon = choice.icon;
                        return (
                            <motion.li
                                key={choice.id}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.1 + position * 0.08, ease: EASE }}
                            >
                                <button
                                    type="button"
                                    className={`${styles.choice} ${position === index ? styles.current : ""}`}
                                    onClick={() =>
                                    {
                                        setIndex(position);
                                        onChoose(choice.id);
                                    }}
                                >
                                    {position === index && <Ring id="welcomeRing" radius={1.8} />}
                                    <span className={styles.icon}><Icon /></span>
                                    <span className={styles.label}>{choice.label}</span>
                                </button>
                            </motion.li>
                        );
                    })}
                </ul>
            </div>
            <div className={screen.foot}>
                <Hints hints={[{ finger: "index", key: "←", label: "Previous" }, { finger: "ring", key: "→", label: "Next" }, { finger: "middle", key: "Enter", label: "Choose" }, { finger: "thumb", key: "Esc", label: "Back" }]} />
            </div>
        </div>
    );
}
