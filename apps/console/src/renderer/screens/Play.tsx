import { motion } from "motion/react";
import type { IGame } from "../Games";
import { useIntent } from "../Intents";
import GameArt from "../ui/GameArt";
import Hints from "../ui/Hints";
import { Home } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import screen from "./Screen.module.css";
import styles from "./Play.module.css";

export default function Play({ game, onHome }: { game: IGame; onHome: () => void })
{
    useIntent((intent) =>
    {
        if (intent === "back" || intent === "select")
        {
            onHome();
            return true;
        }
        return false;
    });

    return (
        <div className={`${screen.screen} ${styles.play}`}>
            <div className={screen.top} />
            <div className={styles.stage}>
                <motion.div
                    className={styles.placeholder}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
                >
                    <div className={styles.art}>
                        <GameArt game={game.id} />
                    </div>
                    <h1>{game.title}</h1>
                    <p>This Game Is Still in Development</p>
                    <button type="button" className={`${screen.button} ${screen.active}`} onClick={onHome}>
                        <Home />
                        Return Home
                    </button>
                </motion.div>
            </div>
            <motion.div className={screen.foot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.1 }}>
                <Hints hints={[{ finger: "thumb", key: "Esc", label: "Home" }]} />
            </motion.div>
        </div>
    );
}
