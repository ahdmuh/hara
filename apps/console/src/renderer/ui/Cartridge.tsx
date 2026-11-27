import { motion, useAnimate } from "motion/react";
import { useEffect, useRef } from "react";
import type { IGame } from "../Games";
import GameArt from "./GameArt";
import { SPRING } from "./Motion";
import Wordmark from "./Wordmark";
import styles from "./Cartridge.module.css";

interface ICartridgeProps
{
    game: IGame;
    selected: boolean;
    inserting: boolean;
    onChoose: () => void;
}

export default function Cartridge({ game, selected, inserting, onChoose }: ICartridgeProps)
{
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const previous = useRef(selected);

    useEffect(() =>
    {
        const becameSelected = selected && !previous.current;
        previous.current = selected;
        if (becameSelected)
        {
            void animate(scope.current, { rotateY: [0, 360] }, { duration: 1.9, ease: [0.45, 0, 0.2, 1] });
        }
    }, [selected, animate, scope]);

    return (
        <motion.button
            type="button"
            className={`${styles.cartridge} ${selected ? styles.selected : ""}`}
            aria-label={game.title}
            aria-current={selected}
            animate={inserting
                ? { scale: [1.22, 1.3, 1.16], y: ["0%", "-6%", "-118%"], opacity: [1, 1, 0] }
                : { scale: selected ? 1.22 : 0.86, y: "0%", opacity: selected ? 1 : 0.72 }}
            transition={inserting ? { duration: 0.85, times: [0, 0.3, 1], ease: [0.5, 0, 0.2, 1] } : SPRING}
            onClick={onChoose}
        >
            <span className={styles.float}>
                <motion.span ref={scope} className={styles.body}>
                    <span className={`${styles.side} ${styles.left}`} />
                    <span className={`${styles.side} ${styles.right}`} />
                    <span className={`${styles.side} ${styles.top}`} />
                    <span className={styles.front}>
                        <span className={styles.notch} />
                        <span className={styles.label}>
                            <GameArt game={game.id} still={!selected} />
                        </span>
                        <span className={styles.name}>{game.title}</span>
                        <span className={styles.ridges} />
                    </span>
                    <span className={styles.back}>
                        <span className={styles.notch} />
                        <Wordmark className={styles.emboss} trademark={false} />
                        <span className={styles.contacts} />
                    </span>
                </motion.span>
            </span>
        </motion.button>
    );
}
