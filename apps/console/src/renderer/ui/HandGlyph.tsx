import { FINGERS, type Finger } from "@hara/input";
import HandFigure, { type HandPose } from "./HandFigure";
import styles from "./HandGlyph.module.css";

const REST = Object.fromEntries(FINGERS.map(finger => [finger, { curl: 0, spread: 1 }])) as HandPose;

export default function HandGlyph({ finger }: { finger: Finger })
{
    return <HandFigure pose={REST} highlight={finger} className={styles.glyph} animated={false} />;
}
