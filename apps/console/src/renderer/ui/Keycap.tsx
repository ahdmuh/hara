import styles from "./Keycap.module.css";

export default function Keycap({ label, large = false }: { label: string; large?: boolean })
{
    return <kbd className={`${styles.keycap} ${large ? styles.large : ""}`}>{label}</kbd>;
}
