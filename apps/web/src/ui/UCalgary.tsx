import shield from "../assets/brands/ucalgary-shield.svg";
import styles from "./UCalgary.module.css";

export const SCHULICH_URL = "https://schulich.ucalgary.ca/";

export default function UCalgary({ className }: { className?: string })
{
    return (
        <a className={`${styles.ucalgary} ${className ?? ""}`} href={SCHULICH_URL} target="_blank" rel="noopener noreferrer">
            <span className={styles.shield} style={{ maskImage: `url(${shield})`, WebkitMaskImage: `url(${shield})` }} aria-hidden="true" />
            <span className={styles.name}>University of Calgary</span>
        </a>
    );
}
